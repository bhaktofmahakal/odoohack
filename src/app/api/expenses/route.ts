import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { processOCR } from '@/lib/ocr'
import { convertCurrency } from '@/lib/currency'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let expenses
    
    // Role-based expense retrieval
    if (user.role === 'ADMIN') {
      // Admin can see all company expenses
      expenses = await prisma.expense.findMany({
        where: { companyId: user.companyId },
        include: {
          submittedBy: true,
          approvalFlow: {
            include: {
              steps: {
                include: {
                  approver: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (user.role === 'MANAGER') {
      // Manager can see their own expenses and team expenses
      const teamMemberIds = await prisma.user.findMany({
        where: { managerId: user.id },
        select: { id: true }
      })
      
      const memberIds = [user.id, ...teamMemberIds.map(member => member.id)]
      
      expenses = await prisma.expense.findMany({
        where: {
          OR: [
            { submittedById: { in: memberIds } },
            {
              approvalFlow: {
                steps: {
                  some: {
                    approverId: user.id,
                    status: 'PENDING'
                  }
                }
              }
            }
          ]
        },
        include: {
          submittedBy: true,
          approvalFlow: {
            include: {
              steps: {
                include: {
                  approver: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Employee can only see their own expenses
      expenses = await prisma.expense.findMany({
        where: { submittedById: user.id },
        include: {
          submittedBy: true,
          approvalFlow: {
            include: {
              steps: {
                include: {
                  approver: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const amount = parseFloat(formData.get('amount') as string)
    const currency = formData.get('currency') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    const date = new Date(formData.get('date') as string)
    const receiptFile = formData.get('receipt') as File | null

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let receiptUrl = null
    let receiptData = null
    let convertedAmount = amount

    // Process OCR if receipt is uploaded
    if (receiptFile) {
      try {
        const ocrResult = await processOCR(receiptFile)
        receiptData = ocrResult
        // You can implement file storage here (S3, Cloudinary, etc.)
        receiptUrl = 'placeholder-receipt-url'
      } catch (error) {
        console.error('OCR processing failed:', error)
      }
    }

    // Convert currency if different from company default
    if (currency !== user.company.currency) {
      try {
        convertedAmount = await convertCurrency(amount, currency, user.company.currency)
      } catch (error) {
        console.error('Currency conversion failed:', error)
      }
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        amount,
        currency,
        convertedAmount,
        category,
        description,
        date,
        receiptUrl,
        receiptData,
        status: 'PENDING',
        companyId: user.companyId,
        submittedById: user.id
      },
      include: {
        submittedBy: true,
        company: true
      }
    })

    // Create approval flow
    await createApprovalFlow(expense.id, user)

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

async function createApprovalFlow(expenseId: string, submittedBy: any) {
  try {
    // Get the expense to check amount for rule conditions
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    })

    if (!expense) return

    // Get applicable approval rules for the company
    const approvalRules = await prisma.approvalRule.findMany({
      where: { 
        companyId: submittedBy.companyId,
        isActive: true,
        // Check amount conditions
        OR: [
          { minAmount: null, maxAmount: null }, // No amount restrictions
          { minAmount: { lte: expense.amount }, maxAmount: null }, // Only min amount
          { minAmount: null, maxAmount: { gte: expense.amount } }, // Only max amount
          { 
            minAmount: { lte: expense.amount }, 
            maxAmount: { gte: expense.amount } 
          } // Both min and max
        ]
      },
      orderBy: { createdAt: 'asc' }
    })

    if (approvalRules.length === 0) {
      // No applicable rules, use default logic
      if (submittedBy.role === 'ADMIN') {
        // Auto-approve admin expenses
        await prisma.expense.update({
          where: { id: expenseId },
          data: { status: 'APPROVED' }
        })
        return
      }
      
      // Create simple manager approval if manager exists
      if (submittedBy.managerId) {
        const flow = await prisma.approvalFlow.create({
          data: {
            expenseId,
            currentStep: 1,
            isCompleted: false
          }
        })

        await prisma.approvalStep.create({
          data: {
            flowId: flow.id,
            stepNumber: 1,
            approverId: submittedBy.managerId,
            status: 'PENDING'
          }
        })
      }
      return
    }

    // Apply first applicable rule
    const rule = approvalRules[0]
    
    const flow = await prisma.approvalFlow.create({
      data: {
        expenseId,
        ruleId: rule.id,
        currentStep: 1,
        isCompleted: false
      }
    })

    let stepNumber = 1

    // Manager first if configured
    if (rule.isManagerFirst && submittedBy.managerId) {
      await prisma.approvalStep.create({
        data: {
          flowId: flow.id,
          stepNumber,
          approverId: submittedBy.managerId,
          status: 'PENDING'
        }
      })
      stepNumber++
    }

    // Apply rule-specific approval steps
    if (rule.ruleType === 'SPECIFIC' && rule.specificApproverId) {
      // Single specific approver
      await prisma.approvalStep.create({
        data: {
          flowId: flow.id,
          stepNumber: rule.isManagerFirst ? stepNumber : 1,
          approverId: rule.specificApproverId,
          status: 'PENDING'
        }
      })
    } else if (rule.ruleType === 'PERCENTAGE') {
      // Get all managers/admins as potential approvers (excluding submitter)
      const approvers = await prisma.user.findMany({
        where: {
          companyId: submittedBy.companyId,
          role: { in: ['ADMIN', 'MANAGER'] },
          id: { not: submittedBy.id },
          isActive: true
        }
      })

      // Create parallel approval steps (all at same step number for percentage rules)
      for (const approver of approvers) {
        await prisma.approvalStep.create({
          data: {
            flowId: flow.id,
            stepNumber: rule.isManagerFirst ? stepNumber : 1,
            approverId: approver.id,
            status: 'PENDING'
          }
        })
      }
    } else if (rule.ruleType === 'HYBRID') {
      // Hybrid: both percentage and specific approver options
      if (rule.specificApproverId) {
        await prisma.approvalStep.create({
          data: {
            flowId: flow.id,
            stepNumber: rule.isManagerFirst ? stepNumber : 1,
            approverId: rule.specificApproverId,
            status: 'PENDING'
          }
        })
      }

      // Also add other approvers for percentage threshold
      const approvers = await prisma.user.findMany({
        where: {
          companyId: submittedBy.companyId,
          role: { in: ['ADMIN', 'MANAGER'] },
          id: { 
            not: submittedBy.id,
            notIn: rule.specificApproverId ? [rule.specificApproverId] : []
          },
          isActive: true
        }
      })

      for (const approver of approvers) {
        await prisma.approvalStep.create({
          data: {
            flowId: flow.id,
            stepNumber: rule.isManagerFirst ? stepNumber : 1,
            approverId: approver.id,
            status: 'PENDING'
          }
        })
      }
    }

  } catch (error) {
    console.error('Error creating approval flow:', error)
    throw error
  }
}
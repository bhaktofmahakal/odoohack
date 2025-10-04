import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/approval-flows - Get approval flows for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    // Build where clause based on user role
    let whereClause: any = {
      expense: {
        companyId: user.companyId
      }
    }

    // For managers and employees, only show flows they're involved in
    if (user.role === 'MANAGER') {
      whereClause.OR = [
        {
          steps: {
            some: {
              approverId: user.id
            }
          }
        },
        {
          expense: {
            submittedById: user.id
          }
        }
      ]
    } else if (user.role === 'EMPLOYEE') {
      whereClause.expense = {
        ...whereClause.expense,
        submittedById: user.id
      }
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      if (status === 'pending') {
        whereClause.isCompleted = false
      } else if (status === 'completed') {
        whereClause.isCompleted = true
      }
    }

    const flows = await prisma.approvalFlow.findMany({
      where: whereClause,
      include: {
        expense: {
          include: {
            submittedBy: {
              select: { id: true, name: true, email: true, role: true }
            },
            company: {
              select: { id: true, name: true, currency: true }
            }
          }
        },
        rule: {
          select: { id: true, name: true, ruleType: true, percentageThreshold: true }
        },
        steps: {
          include: {
            approver: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: {
            stepNumber: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(flows)
  } catch (error) {
    console.error('Error fetching approval flows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approval flows' }, 
      { status: 500 }
    )
  }
}

// POST /api/approval-flows - Create approval flow for expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const body = await request.json()
    const { expenseId, ruleId } = body

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required' }, 
        { status: 400 }
      )
    }

    // Verify expense exists and belongs to user's company
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        companyId: user.companyId
      },
      include: {
        submittedBy: {
          include: {
            manager: true
          }
        }
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if approval flow already exists
    const existingFlow = await prisma.approvalFlow.findUnique({
      where: { expenseId }
    })

    if (existingFlow) {
      return NextResponse.json({ error: 'Approval flow already exists for this expense' }, { status: 400 })
    }

    let selectedRule = null
    if (ruleId) {
      selectedRule = await prisma.approvalRule.findFirst({
        where: {
          id: ruleId,
          companyId: user.companyId,
          isActive: true
        }
      })
    }

    // Create approval flow
    const flow = await prisma.approvalFlow.create({
      data: {
        expenseId,
        ruleId: selectedRule?.id,
        currentStep: 1,
        isCompleted: false
      },
      include: {
        expense: {
          include: {
            submittedBy: {
              include: {
                manager: true
              }
            }
          }
        },
        rule: true
      }
    })

    // Create approval steps based on rule or default logic
    await createApprovalSteps(flow, selectedRule)

    // Return updated flow with steps
    const completeFlow = await prisma.approvalFlow.findUnique({
      where: { id: flow.id },
      include: {
        expense: {
          include: {
            submittedBy: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        rule: true,
        steps: {
          include: {
            approver: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: {
            stepNumber: 'asc'
          }
        }
      }
    })

    return NextResponse.json(completeFlow)
  } catch (error) {
    console.error('Error creating approval flow:', error)
    return NextResponse.json(
      { error: 'Failed to create approval flow' }, 
      { status: 500 }
    )
  }
}

// Helper function to create approval steps
async function createApprovalSteps(flow: any, rule: any) {
  const expense = flow.expense
  const submitter = expense.submittedBy

  if (rule) {
    // Rule-based approval steps
    if (rule.ruleType === 'SPECIFIC' && rule.specificApproverId) {
      // Single specific approver
      await prisma.approvalStep.create({
        data: {
          flowId: flow.id,
          stepNumber: 1,
          approverId: rule.specificApproverId,
          status: 'PENDING'
        }
      })
    } else if (rule.ruleType === 'PERCENTAGE') {
      // Get all potential approvers (managers and admins)
      const approvers = await prisma.user.findMany({
        where: {
          companyId: submitter.companyId,
          role: { in: ['MANAGER', 'ADMIN'] },
          isActive: true,
          id: { not: submitter.id } // Exclude submitter
        }
      })

      // Create steps for all approvers (parallel approval)
      for (let i = 0; i < approvers.length; i++) {
        await prisma.approvalStep.create({
          data: {
            flowId: flow.id,
            stepNumber: 1, // All at step 1 for percentage rules
            approverId: approvers[i].id,
            status: 'PENDING'
          }
        })
      }
    } else if (rule.ruleType === 'HYBRID') {
      // Manager first, then percentage/specific
      if (rule.isManagerFirst && submitter.manager) {
        await prisma.approvalStep.create({
          data: {
            flowId: flow.id,
            stepNumber: 1,
            approverId: submitter.manager.id,
            status: 'PENDING'
          }
        })

        // Additional steps based on other rule criteria
        if (rule.specificApproverId) {
          await prisma.approvalStep.create({
            data: {
              flowId: flow.id,
              stepNumber: 2,
              approverId: rule.specificApproverId,
              status: 'PENDING'
            }
          })
        }
      }
    }
  } else {
    // Default approval logic: direct manager
    if (submitter.manager) {
      await prisma.approvalStep.create({
        data: {
          flowId: flow.id,
          stepNumber: 1,
          approverId: submitter.manager.id,
          status: 'PENDING'
        }
      })
    }
  }
}
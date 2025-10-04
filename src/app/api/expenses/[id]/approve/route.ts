import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, comment } = await request.json()
    const expenseId = params.id

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get expense with approval flow
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        approvalFlow: {
          include: {
            steps: {
              include: {
                approver: true
              },
              orderBy: { stepNumber: 'asc' }
            },
            rule: true
          }
        }
      }
    })

    if (!expense || !expense.approvalFlow) {
      return NextResponse.json({ error: 'Expense or approval flow not found' }, { status: 404 })
    }

    // Find the user's pending step
    const userStep = expense.approvalFlow.steps.find(
      step => step.approverId === user.id && step.status === 'PENDING'
    )

    if (!userStep) {
      return NextResponse.json({ error: 'No pending approval step found' }, { status: 404 })
    }

    // Update the approval step
    await prisma.approvalStep.update({
      where: { id: userStep.id },
      data: {
        status: action,
        comment,
        approvedAt: new Date()
      }
    })

    // Check if approval flow should be completed
    const updatedFlow = await prisma.approvalFlow.findUnique({
      where: { id: expense.approvalFlow.id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        },
        rule: true
      }
    })

    if (!updatedFlow) {
      return NextResponse.json({ error: 'Updated flow not found' }, { status: 404 })
    }

    let finalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING'

    if (action === 'REJECTED') {
      // If any step is rejected, entire expense is rejected
      finalStatus = 'REJECTED'
    } else {
      // Check approval logic based on rule type
      if (updatedFlow.rule?.ruleType === 'SPECIFIC') {
        // Specific approver rule - if this approver approved, expense is approved
        if (updatedFlow.rule.specificApproverId === user.id) {
          finalStatus = 'APPROVED'
        }
      } else if (updatedFlow.rule?.ruleType === 'PERCENTAGE') {
        // Percentage rule - check if enough approvers have approved
        const totalApprovers = updatedFlow.steps.length
        const approvedCount = updatedFlow.steps.filter(step => step.status === 'APPROVED').length
        const approvedPercentage = (approvedCount / totalApprovers) * 100

        if (approvedPercentage >= (updatedFlow.rule.percentageThreshold || 50)) {
          finalStatus = 'APPROVED'
        }
      } else if (updatedFlow.rule?.ruleType === 'HYBRID') {
        // Hybrid rule - either percentage OR specific approver
        const isSpecificApprover = updatedFlow.rule.specificApproverId === user.id
        
        if (isSpecificApprover) {
          finalStatus = 'APPROVED'
        } else {
          // Check percentage
          const totalApprovers = updatedFlow.steps.length
          const approvedCount = updatedFlow.steps.filter(step => step.status === 'APPROVED').length
          const approvedPercentage = (approvedCount / totalApprovers) * 100

          if (approvedPercentage >= (updatedFlow.rule.percentageThreshold || 50)) {
            finalStatus = 'APPROVED'
          }
        }
      } else {
        // Sequential approval - check if all previous steps are approved
        const currentStepIndex = updatedFlow.steps.findIndex(step => step.id === userStep.id)
        const previousSteps = updatedFlow.steps.slice(0, currentStepIndex + 1)
        const allPreviousApproved = previousSteps.every(step => step.status === 'APPROVED')

        if (allPreviousApproved) {
          const remainingSteps = updatedFlow.steps.slice(currentStepIndex + 1)
          if (remainingSteps.length === 0) {
            finalStatus = 'APPROVED'
          } else {
            // Move to next step
            await prisma.approvalFlow.update({
              where: { id: updatedFlow.id },
              data: { currentStep: updatedFlow.currentStep + 1 }
            })
          }
        }
      }
    }

    // Update expense status if flow is completed
    if (finalStatus !== 'PENDING') {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: finalStatus }
      })

      await prisma.approvalFlow.update({
        where: { id: updatedFlow.id },
        data: { isCompleted: true }
      })
    }

    // Return updated expense with approval flow
    const updatedExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        submittedBy: true,
        approvalFlow: {
          include: {
            steps: {
              include: {
                approver: true
              },
              orderBy: { stepNumber: 'asc' }
            }
          }
        }
      }
    })

    return NextResponse.json({
      expense: updatedExpense,
      action,
      comment,
      finalStatus
    })

  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
  }
}
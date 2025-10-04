import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/approval-rules/[id] - Get specific approval rule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const ruleId = params.id

    const rule = await prisma.approvalRule.findFirst({
      where: {
        id: ruleId,
        companyId: user.companyId // Ensure rule belongs to user's company
      },
      include: {
        company: true,
        _count: {
          select: {
            approvalFlows: true
          }
        }
      }
    })

    if (!rule) {
      return NextResponse.json({ error: 'Approval rule not found' }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error fetching approval rule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approval rule' }, 
      { status: 500 }
    )
  }
}

// PUT /api/approval-rules/[id] - Update approval rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const ruleId = params.id

    // Only admins can update approval rules
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify rule exists and belongs to user's company
    const existingRule = await prisma.approvalRule.findFirst({
      where: {
        id: ruleId,
        companyId: user.companyId
      }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Approval rule not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      name, 
      ruleType, 
      percentageThreshold, 
      specificApproverId, 
      isManagerFirst,
      minAmount,
      maxAmount,
      isActive
    } = body

    // Validate rule type specific fields
    if (ruleType === 'PERCENTAGE' && percentageThreshold === undefined) {
      return NextResponse.json(
        { error: 'Percentage threshold is required for PERCENTAGE rules' }, 
        { status: 400 }
      )
    }

    if (ruleType === 'SPECIFIC' && !specificApproverId) {
      return NextResponse.json(
        { error: 'Specific approver ID is required for SPECIFIC rules' }, 
        { status: 400 }
      )
    }

    const updatedRule = await prisma.approvalRule.update({
      where: { id: ruleId },
      data: {
        ...(name && { name }),
        ...(ruleType && { ruleType }),
        percentageThreshold: ruleType === 'PERCENTAGE' ? percentageThreshold : null,
        specificApproverId: ruleType === 'SPECIFIC' ? specificApproverId : null,
        isManagerFirst: isManagerFirst !== undefined ? Boolean(isManagerFirst) : undefined,
        minAmount: minAmount !== undefined ? (minAmount ? parseFloat(minAmount) : null) : undefined,
        maxAmount: maxAmount !== undefined ? (maxAmount ? parseFloat(maxAmount) : null) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: {
        company: true,
        _count: {
          select: {
            approvalFlows: true
          }
        }
      }
    })

    return NextResponse.json(updatedRule)
  } catch (error) {
    console.error('Error updating approval rule:', error)
    return NextResponse.json(
      { error: 'Failed to update approval rule' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/approval-rules/[id] - Delete approval rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const ruleId = params.id

    // Only admins can delete approval rules
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if rule is in use
    const ruleInUse = await prisma.approvalRule.findFirst({
      where: {
        id: ruleId,
        companyId: user.companyId
      },
      include: {
        _count: {
          select: {
            approvalFlows: true
          }
        }
      }
    })

    if (!ruleInUse) {
      return NextResponse.json({ error: 'Approval rule not found' }, { status: 404 })
    }

    if (ruleInUse._count.approvalFlows > 0) {
      return NextResponse.json(
        { error: 'Cannot delete rule that is being used by existing expenses' }, 
        { status: 400 }
      )
    }

    await prisma.approvalRule.delete({
      where: { id: ruleId }
    })

    return NextResponse.json({ message: 'Approval rule deleted successfully' })
  } catch (error) {
    console.error('Error deleting approval rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete approval rule' }, 
      { status: 500 }
    )
  }
}
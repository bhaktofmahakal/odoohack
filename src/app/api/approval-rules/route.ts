import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/approval-rules - Get all approval rules for company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any

    // Only admins can view approval rules
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rules = await prisma.approvalRule.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        company: true,
        _count: {
          select: {
            approvalFlows: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching approval rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approval rules' }, 
      { status: 500 }
    )
  }
}

// POST /api/approval-rules - Create new approval rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any

    // Only admins can create approval rules
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      ruleType, 
      percentageThreshold, 
      specificApproverId, 
      isManagerFirst,
      minAmount,
      maxAmount 
    } = body

    // Validate required fields
    if (!name || !ruleType) {
      return NextResponse.json(
        { error: 'Name and ruleType are required' }, 
        { status: 400 }
      )
    }

    // Validate rule type specific fields
    if (ruleType === 'PERCENTAGE' && !percentageThreshold) {
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

    const rule = await prisma.approvalRule.create({
      data: {
        name,
        companyId: user.companyId,
        ruleType,
        percentageThreshold: ruleType === 'PERCENTAGE' ? percentageThreshold : null,
        specificApproverId: ruleType === 'SPECIFIC' ? specificApproverId : null,
        isManagerFirst: Boolean(isManagerFirst),
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
      },
      include: {
        company: true
      }
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error creating approval rule:', error)
    return NextResponse.json(
      { error: 'Failed to create approval rule' }, 
      { status: 500 }
    )
  }
}
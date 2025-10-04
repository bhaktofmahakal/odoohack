import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all team members with their expense data
    const teamMembers = await prisma.user.findMany({
      where: {
        companyId: user.companyId
      },
      include: {
        expenses: {
          select: {
            convertedAmount: true,
            createdAt: true
          }
        },
        manager: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate expense statistics for each member
    const teamData = teamMembers.map(member => {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const totalExpenses = member.expenses.reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0)
      const monthlyExpenses = member.expenses
        .filter(expense => {
          const expenseDate = new Date(expense.createdAt)
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
        })
        .reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0)

      return {
        id: member.id,
        name: member.name || 'Unknown User',
        email: member.email,
        role: member.role,
        avatar: member.image,
        joinedAt: member.createdAt.toISOString().split('T')[0],
        lastActive: member.updatedAt.toISOString().split('T')[0],
        manager: member.manager?.name,
        totalExpenses,
        monthlyExpenses,
        status: member.isActive ? 'ACTIVE' : 'INACTIVE'
      }
    })

    return NextResponse.json(teamData)

  } catch (error) {
    console.error('Error fetching team data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { name, email, role, managerId } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create new team member
    const newMember = await prisma.user.create({
      data: {
        name,
        email,
        role: role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
        companyId: user.companyId!,
        managerId: managerId || null,
        isActive: true
      }
    })

    return NextResponse.json({
      id: newMember.id,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      joinedAt: newMember.createdAt.toISOString().split('T')[0],
      lastActive: newMember.updatedAt.toISOString().split('T')[0],
      totalExpenses: 0,
      monthlyExpenses: 0,
      status: 'ACTIVE'
    })

  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    )
  }
}
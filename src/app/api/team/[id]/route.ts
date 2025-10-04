import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { name, email, role, managerId, isActive } = await request.json()

    // Check if the target user exists and belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update the user
    const updatedMember = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: name || targetUser.name,
        email: email || targetUser.email,
        role: role || targetUser.role,
        managerId: managerId === '' ? null : (managerId || targetUser.managerId),
        isActive: isActive !== undefined ? isActive : targetUser.isActive
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
      }
    })

    // Calculate expense statistics
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const totalExpenses = updatedMember.expenses.reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0)
    const monthlyExpenses = updatedMember.expenses
      .filter(expense => {
        const expenseDate = new Date(expense.createdAt)
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
      })
      .reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0)

    return NextResponse.json({
      id: updatedMember.id,
      name: updatedMember.name,
      email: updatedMember.email,
      role: updatedMember.role,
      avatar: updatedMember.image,
      joinedAt: updatedMember.createdAt.toISOString().split('T')[0],
      lastActive: updatedMember.updatedAt.toISOString().split('T')[0],
      manager: updatedMember.manager?.name,
      totalExpenses,
      monthlyExpenses,
      status: updatedMember.isActive ? 'ACTIVE' : 'INACTIVE'
    })

  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if the target user exists and belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't allow deletion of self
    if (params.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Check if user has pending expenses
    const pendingExpenses = await prisma.expense.findFirst({
      where: {
        submittedById: params.id,
        status: 'PENDING'
      }
    })

    if (pendingExpenses) {
      return NextResponse.json(
        { error: 'Cannot delete user with pending expenses' },
        { status: 400 }
      )
    }

    // Update any team members who have this user as their manager
    await prisma.user.updateMany({
      where: { managerId: params.id },
      data: { managerId: null }
    })

    // Soft delete - mark as inactive instead of actual deletion
    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    )
  }
}
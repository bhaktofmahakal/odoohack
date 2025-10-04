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
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only admins can view all users
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      where: { companyId: user.companyId },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        employees: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            expenses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, email, role, managerId } = await request.json()

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // If manager is specified, verify they exist and are in the same company
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      })

      if (!manager || manager.companyId !== currentUser.companyId) {
        return NextResponse.json({ error: 'Invalid manager' }, { status: 400 })
      }

      if (!['ADMIN', 'MANAGER'].includes(manager.role)) {
        return NextResponse.json({ error: 'Manager must have ADMIN or MANAGER role' }, { status: 400 })
      }
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        companyId: currentUser.companyId,
        managerId: managerId || null,
        isActive: true
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// Update user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id, name, role, managerId, isActive } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user to update
    const userToUpdate = await prisma.user.findUnique({
      where: { id }
    })

    if (!userToUpdate || userToUpdate.companyId !== currentUser.companyId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from changing their own role
    if (userToUpdate.id === currentUser.id && role !== currentUser.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (role !== undefined) {
      if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updateData.role = role
    }
    if (managerId !== undefined) updateData.managerId = managerId
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        employees: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
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

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '3M'
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '3M':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '6M':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 3)
    }

    // Get all expenses for the time period
    const expenses = await prisma.expense.findMany({
      where: {
        companyId: user.companyId,
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        submittedBy: true,
        approvalFlow: {
          include: {
            steps: true
          }
        }
      }
    })

    // Calculate basic metrics
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0)
    const approvedExpenses = expenses
      .filter(expense => expense.status === 'APPROVED')
      .reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0)
    const rejectedExpenses = expenses
      .filter(expense => expense.status === 'REJECTED')
      .reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0)
    const pendingExpenses = expenses
      .filter(expense => expense.status === 'PENDING')
      .reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0)

    // Calculate monthly trend
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(startDate.getDate() - (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const previousPeriodExpenses = await prisma.expense.findMany({
      where: {
        companyId: user.companyId,
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    })

    const previousTotal = previousPeriodExpenses.reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0)
    const monthlyTrend = previousTotal > 0 ? ((totalExpenses - previousTotal) / previousTotal * 100) : 0

    // Calculate average processing time
    const completedExpenses = expenses.filter(expense => 
      expense.status === 'APPROVED' || expense.status === 'REJECTED'
    )
    
    let totalProcessingDays = 0
    let processedCount = 0

    for (const expense of completedExpenses) {
      if (expense.approvalFlow) {
        const lastStep = expense.approvalFlow.steps
          .filter(step => step.status !== 'PENDING')
          .sort((a, b) => new Date(b.approvedAt || b.createdAt).getTime() - new Date(a.approvedAt || a.createdAt).getTime())[0]
        
        if (lastStep?.approvedAt) {
          const processingTime = new Date(lastStep.approvedAt).getTime() - new Date(expense.createdAt).getTime()
          totalProcessingDays += processingTime / (1000 * 60 * 60 * 24)
          processedCount++
        }
      }
    }

    const avgProcessingTime = processedCount > 0 ? totalProcessingDays / processedCount : 0

    // Calculate top categories
    const categoryMap = new Map<string, { amount: number; count: number }>()
    
    expenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 }
      categoryMap.set(expense.category, {
        amount: existing.amount + (expense.convertedAmount || 0),
        count: existing.count + 1
      })
    })

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Calculate team performance
    const userMap = new Map<string, { expenses: number; count: number }>()
    
    expenses.forEach(expense => {
      const userId = expense.submittedBy.id
      const userName = expense.submittedBy.name || 'Unknown User'
      const existing = userMap.get(userId) || { expenses: 0, count: 0 }
      userMap.set(userId, {
        expenses: existing.expenses + (expense.convertedAmount || 0),
        count: existing.count + 1
      })
    })

    const teamPerformance = Array.from(userMap.entries())
      .map(([userId, data]) => {
        const user = expenses.find(e => e.submittedBy.id === userId)?.submittedBy
        return {
          name: user?.name || 'Unknown User',
          expenses: data.expenses,
          avgAmount: data.count > 0 ? data.expenses / data.count : 0
        }
      })
      .sort((a, b) => b.expenses - a.expenses)
      .slice(0, 10)

    // Calculate monthly data
    const monthlyMap = new Map<string, { amount: number; count: number }>()
    
    expenses.forEach(expense => {
      const monthKey = new Date(expense.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      })
      const existing = monthlyMap.get(monthKey) || { amount: 0, count: 0 }
      monthlyMap.set(monthKey, {
        amount: existing.amount + (expense.convertedAmount || 0),
        count: existing.count + 1
      })
    })

    const monthlyData = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    const analyticsData = {
      totalExpenses,
      approvedExpenses,
      rejectedExpenses,
      pendingExpenses,
      monthlyTrend: Math.round(monthlyTrend * 10) / 10,
      avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
      topCategories,
      teamPerformance,
      monthlyData
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
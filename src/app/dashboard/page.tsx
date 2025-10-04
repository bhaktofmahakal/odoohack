'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnimatedStatsCard } from '@/components/ui/animated-stats-card'
import { ReceiptScanner } from '@/components/ui/receipt-scanner'
import { ApprovalFlowVisualizer } from '@/components/ui/approval-flow-visualizer'
import { useToast } from '@/components/ui/toast'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { 
  DollarSign, 
  Receipt, 
  Clock, 
  TrendingUp, 
  Users,
  Plus,
  CheckSquare,
  FileText
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session } = useSession()
  const { addToast } = useToast()
  const [expenses, setExpenses] = useState([])
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingApprovals: 0,
    thisMonth: 0,
    teamMembers: 0
  })
  const [loading, setLoading] = useState(true)

  const user = session?.user as any

  useEffect(() => {
    if (session) {
      fetchDashboardData()
      showWelcomeToast()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      // Fetch expenses
      const expensesResponse = await fetch('/api/expenses')
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json()
        setExpenses(expensesData)
        
        // Calculate stats
        const totalAmount = expensesData.reduce((sum: number, expense: any) => 
          sum + (expense.convertedAmount || expense.amount), 0)
        
        const pending = expensesData.filter((exp: any) => exp.status === 'PENDING').length
        
        const thisMonth = expensesData
          .filter((exp: any) => {
            const expenseDate = new Date(exp.date)
            const now = new Date()
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear()
          })
          .reduce((sum: number, expense: any) => 
            sum + (expense.convertedAmount || expense.amount), 0)

        setStats({
          totalExpenses: totalAmount,
          pendingApprovals: pending,
          thisMonth,
          teamMembers: 1 // Will be updated when we add team members
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showWelcomeToast = () => {
    const greeting = getGreeting()
    addToast({
      type: 'success',
      title: `${greeting}, ${user?.name}! 👋`,
      description: `Welcome to your ${user?.role.toLowerCase()} dashboard.`,
      duration: 4000
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const handleScanComplete = (result: any) => {
    addToast({
      type: 'success',
      title: 'Receipt Scanned Successfully!',
      description: `Extracted $${result.amount} from ${result.merchant}`,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const dashboardStats = [
    { 
      title: 'Total Expenses', 
      value: stats.totalExpenses,
      currency: user?.company?.currency || 'USD', 
      trend: 'up' as const, 
      trendValue: '+12%',
      icon: <DollarSign className="h-5 w-5" />
    },
    { 
      title: user?.role === 'EMPLOYEE' ? 'My Expenses' : 'Pending Approvals', 
      value: stats.pendingApprovals, 
      trend: 'down' as const, 
      trendValue: '-3%',
      icon: user?.role === 'EMPLOYEE' ? <Receipt className="h-5 w-5" /> : <Clock className="h-5 w-5" />
    },
    { 
      title: 'This Month', 
      value: stats.thisMonth, 
      currency: user?.company?.currency || 'USD', 
      trend: 'up' as const,
      trendValue: '+8%',
      icon: <TrendingUp className="h-5 w-5" />
    },
    { 
      title: 'Team Members', 
      value: stats.teamMembers, 
      trend: 'neutral' as const,
      icon: <Users className="h-5 w-5" />
    },
  ]

  // Get recent expenses for approval flow visualization
  const recentExpense = expenses.find((exp: any) => exp.approvalFlow)
  const mockApprovalSteps = (recentExpense as any)?.approvalFlow?.steps || [
    {
      id: '1',
      stepNumber: 1,
      approverName: 'Manager Review',
      status: 'pending' as const,
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <div>
          <h1 className="text-3xl font-bold">
            {getGreeting()}, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Welcome to your {user?.role.toLowerCase()} dashboard at {user?.company?.name}
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {dashboardStats.map((stat, index) => (
          <AnimatedStatsCard
            key={stat.title}
            {...stat}
            delay={index * 0.1}
          />
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Link href="/dashboard/expenses/new">
          <Button className="w-full h-16 gap-3 text-base">
            <Plus className="h-5 w-5" />
            Submit Expense
          </Button>
        </Link>
        
        <Link href="/dashboard/expenses">
          <Button variant="outline" className="w-full h-16 gap-3 text-base">
            <Receipt className="h-5 w-5" />
            My Expenses
          </Button>
        </Link>

        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
          <Link href="/dashboard/approvals">
            <Button variant="outline" className="w-full h-16 gap-3 text-base">
              <CheckSquare className="h-5 w-5" />
              Approvals
            </Button>
          </Link>
        )}

        {user?.role === 'ADMIN' && (
          <Link href="/dashboard/team">
            <Button variant="outline" className="w-full h-16 gap-3 text-base">
              <Users className="h-5 w-5" />
              Manage Team
            </Button>
          </Link>
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Receipt Scanner */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <ReceiptScanner onScanComplete={handleScanComplete} />
        </motion.div>

        {/* Approval Flow or Recent Activity */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          {mockApprovalSteps.length > 0 ? (
            <ApprovalFlowVisualizer steps={mockApprovalSteps} />
          ) : (
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent expense submissions and approvals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity to show.
                  <br />
                  <Link href="/dashboard/expenses/new">
                    <Button variant="link" className="mt-2">
                      Submit your first expense
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
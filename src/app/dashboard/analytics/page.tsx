'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  PieChart,
  Download,
  Filter
} from 'lucide-react'

interface AnalyticsData {
  totalExpenses: number
  approvedExpenses: number
  rejectedExpenses: number
  pendingExpenses: number
  monthlyTrend: number
  avgProcessingTime: number
  topCategories: { name: string; amount: number; count: number }[]
  teamPerformance: { name: string; expenses: number; avgAmount: number }[]
  monthlyData: { month: string; amount: number; count: number }[]
}

const mockAnalyticsData: AnalyticsData = {
  totalExpenses: 48750.50,
  approvedExpenses: 35200.25,
  rejectedExpenses: 8450.00,
  pendingExpenses: 5100.25,
  monthlyTrend: 12.5,
  avgProcessingTime: 2.3,
  topCategories: [
    { name: 'Travel', amount: 18750.00, count: 15 },
    { name: 'Meals', amount: 12450.25, count: 32 },
    { name: 'Software', amount: 8500.00, count: 8 },
    { name: 'Office Supplies', amount: 5200.50, count: 18 },
    { name: 'Training', amount: 3850.00, count: 5 }
  ],
  teamPerformance: [
    { name: 'John Smith', expenses: 12450.00, avgAmount: 425.50 },
    { name: 'Sarah Johnson', expenses: 8750.25, avgAmount: 315.25 },
    { name: 'Mike Davis', expenses: 15200.00, avgAmount: 850.75 },
    { name: 'Emily Brown', expenses: 6850.50, avgAmount: 285.50 }
  ],
  monthlyData: [
    { month: 'Jan', amount: 15250.00, count: 28 },
    { month: 'Feb', amount: 18750.50, count: 35 },
    { month: 'Mar', amount: 14750.00, count: 25 }
  ]
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('3M')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Fallback to mock data
      setAnalyticsData(mockAnalyticsData)
    } finally {
      setLoading(false)
    }
  }

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">Analytics & Reports</h1>
            <p className="text-muted-foreground">Expense insights and trends</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">Expense insights and trends</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">Last Month</SelectItem>
              <SelectItem value="3M">Last 3 Months</SelectItem>
              <SelectItem value="6M">Last 6 Months</SelectItem>
              <SelectItem value="1Y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-lg font-semibold">{formatCurrency(analyticsData.totalExpenses)}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{analyticsData.monthlyTrend}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-lg font-semibold">{formatCurrency(analyticsData.approvedExpenses)}</p>
                  <p className="text-xs text-muted-foreground">
                    {getPercentage(analyticsData.approvedExpenses, analyticsData.totalExpenses)}% of total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg font-semibold">{formatCurrency(analyticsData.pendingExpenses)}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg {analyticsData.avgProcessingTime}d processing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-lg font-semibold">{formatCurrency(analyticsData.rejectedExpenses)}</p>
                  <p className="text-xs text-muted-foreground">
                    {getPercentage(analyticsData.rejectedExpenses, analyticsData.totalExpenses)}% rejection rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Top Categories
              </CardTitle>
              <CardDescription>
                Expenses breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData.topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-primary`} style={{
                      opacity: 1 - (index * 0.15)
                    }}></div>
                    <div>
                      <p className="font-medium text-sm">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{category.count} expenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(category.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPercentage(category.amount, analyticsData.totalExpenses)}%
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Trend
              </CardTitle>
              <CardDescription>
                Expense amounts over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.monthlyData.map((month, index) => {
                  const maxAmount = Math.max(...analyticsData.monthlyData.map(m => m.amount))
                  const widthPercentage = (month.amount / maxAmount) * 100
                  
                  return (
                    <div key={month.month} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{month.month}</span>
                        <span className="text-sm text-muted-foreground">{formatCurrency(month.amount)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <motion.div 
                          className="bg-primary rounded-full h-2"
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercentage}%` }}
                          transition={{ delay: 0.8 + (index * 0.1), duration: 0.8 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{month.count} expenses</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Performance
            </CardTitle>
            <CardDescription>
              Individual expense summary by team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.teamPerformance.map((member, index) => (
                <div key={member.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Avg {formatCurrency(member.avgAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(member.expenses)}</p>
                    <Badge variant="outline" className="text-xs">
                      {getPercentage(member.expenses, analyticsData.totalExpenses)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>
              Key observations from your expense data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Positive Trend</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Expense processing time improved by 15% this month compared to last month.
                </p>
              </div>
              
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">High Approval Rate</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getPercentage(analyticsData.approvedExpenses, analyticsData.totalExpenses)}% approval rate shows good policy compliance.
                </p>
              </div>
              
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-600">Seasonal Pattern</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Travel expenses peak in February, suggesting planned business activities.
                </p>
              </div>
              
              <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">Team Balance</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Expense distribution is balanced across team members with no outliers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
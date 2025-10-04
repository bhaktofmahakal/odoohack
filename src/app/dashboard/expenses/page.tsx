'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Receipt, 
  Search, 
  Filter, 
  Eye,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Plus
} from 'lucide-react'
import Link from 'next/link'

interface Expense {
  id: string
  amount: number
  currency: string
  convertedAmount: number
  category: string
  description: string
  date: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  receiptUrl?: string
  createdAt: string
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    amount: 1250.00,
    currency: 'USD',
    convertedAmount: 1250.00,
    category: 'Travel',
    description: 'Flight to client meeting',
    date: '2024-01-15',
    status: 'APPROVED',
    receiptUrl: '/mock-receipt.jpg',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2', 
    amount: 85.50,
    currency: 'USD',
    convertedAmount: 85.50,
    category: 'Meals',
    description: 'Team lunch meeting',
    date: '2024-01-14',
    status: 'PENDING',
    receiptUrl: '/mock-receipt.jpg',
    createdAt: '2024-01-14T14:30:00Z'
  },
  {
    id: '3',
    amount: 45.00,
    currency: 'USD', 
    convertedAmount: 45.00,
    category: 'Office Supplies',
    description: 'Notebook and pens',
    date: '2024-01-12',
    status: 'REJECTED',
    createdAt: '2024-01-12T16:20:00Z'
  }
]

export default function ExpensesPage() {
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (!response.ok) throw new Error('Failed to fetch expenses')
      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      // Fallback to mock data
      setExpenses(mockExpenses)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || expense.status === statusFilter
    const matchesCategory = categoryFilter === 'ALL' || expense.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getTotalByStatus = (status: string) => {
    return expenses
      .filter(expense => status === 'ALL' || expense.status === status)
      .reduce((sum, expense) => sum + expense.convertedAmount, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">My Expenses</h1>
            <p className="text-muted-foreground">Track and manage your expense submissions</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">My Expenses</h1>
          <p className="text-muted-foreground">Track and manage your expense submissions</p>
        </div>
        
        <Link href="/dashboard/expenses/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Submit New Expense
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
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
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">${getTotalByStatus('ALL').toLocaleString()}</p>
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
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-lg font-semibold">${getTotalByStatus('PENDING').toLocaleString()}</p>
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
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-lg font-semibold">${getTotalByStatus('APPROVED').toLocaleString()}</p>
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
                  <p className="text-lg font-semibold">${getTotalByStatus('REJECTED').toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Meals">Meals</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredExpenses.map((expense, index) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Receipt className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-sm sm:text-base truncate">{expense.description}</h3>
                            <Badge 
                              variant="outline" 
                              className={`${getStatusColor(expense.status)} shrink-0`}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(expense.status)}
                                <span className="text-xs">{expense.status}</span>
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(expense.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              <span>{expense.category}</span>
                            </div>
                          </div>
                          
                          <div className="text-xl font-semibold text-primary">
                            ${expense.convertedAmount.toLocaleString()}
                            {expense.currency !== 'USD' && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ({expense.currency} {expense.amount})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 sm:pt-0">
                      {expense.receiptUrl && (
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-3 w-3" />
                          <span className="hidden sm:inline">View Receipt</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredExpenses.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? "Try adjusting your filters"
                  : "Get started by submitting your first expense"
                }
              </p>
              {!searchQuery && statusFilter === 'ALL' && categoryFilter === 'ALL' && (
                <Link href="/dashboard/expenses/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Submit Expense
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
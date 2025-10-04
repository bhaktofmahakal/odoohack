'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  CheckSquare, 
  XCircle,
  Eye,
  Calendar,
  CreditCard,
  User,
  Clock,
  CheckCircle,
  MessageCircle,
  DollarSign,
  FileText,
  AlertCircle,
  Percent,
  UserCheck,
  Target,
  ArrowRight,
  Timer
} from 'lucide-react'

interface ExpenseWithFlow {
  id: string
  amount: number
  currency: string
  convertedAmount: number | null
  category: string
  description: string
  date: string
  status: string
  createdAt: string
  submittedBy: {
    id: string
    name: string
    email: string
    role: string
  }
  approvalFlow?: {
    id: string
    currentStep: number
    isCompleted: boolean
    rule?: {
      id: string
      name: string
      ruleType: string
      percentageThreshold: number | null
    }
    steps: Array<{
      id: string
      stepNumber: number
      status: string
      comment: string | null
      approvedAt: string | null
      approver: {
        id: string
        name: string
        email: string
        role: string
      }
    }>
  }
}

export default function ApprovalsPage() {
  const { data: session } = useSession()
  const [expenses, setExpenses] = useState<ExpenseWithFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithFlow | null>(null)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const user = session?.user as any

  useEffect(() => {
    if (session) {
      fetchExpenses()
    }
  }, [session, statusFilter])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/expenses`)
      if (response.ok) {
        const allExpenses = await response.json()
        
        // Filter expenses based on user role and approval requirements
        let filteredExpenses = allExpenses.filter((expense: ExpenseWithFlow) => {
          // Only show expenses that need approval or have approval flows
          if (!expense.approvalFlow) return false
          
          // For managers and admins, show expenses where they have pending steps
          if (user.role === 'MANAGER' || user.role === 'ADMIN') {
            const hasPendingStep = expense.approvalFlow.steps.some(
              step => step.approver.id === user.id && step.status === 'PENDING'
            )
            const isSubmittedByUser = expense.submittedBy.id === user.id
            return hasPendingStep || isSubmittedByUser
          }
          
          // For employees, only show their own expenses
          return expense.submittedBy.id === user.id
        })

        // Apply status filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'pending') {
            filteredExpenses = filteredExpenses.filter((expense: ExpenseWithFlow) => 
              !expense.approvalFlow?.isCompleted
            )
          } else if (statusFilter === 'completed') {
            filteredExpenses = filteredExpenses.filter((expense: ExpenseWithFlow) => 
              expense.approvalFlow?.isCompleted
            )
          } else if (statusFilter === 'my_pending') {
            filteredExpenses = filteredExpenses.filter((expense: ExpenseWithFlow) => 
              expense.approvalFlow?.steps.some(
                step => step.approver.id === user.id && step.status === 'PENDING'
              )
            )
          }
        }

        setExpenses(filteredExpenses)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (!selectedExpense) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/expenses/${selectedExpense.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          comment: comment.trim()
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Expense ${action.toLowerCase()} successfully!`)
        setSelectedExpense(null)
        setComment('')
        fetchExpenses()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to process approval')
      }
    } catch (error) {
      toast.error('Failed to process approval')
    } finally {
      setActionLoading(false)
    }
  }

  const getRuleIcon = (ruleType?: string) => {
    switch (ruleType) {
      case 'PERCENTAGE':
        return <Percent className="h-4 w-4" />
      case 'SPECIFIC':
        return <UserCheck className="h-4 w-4" />
      case 'HYBRID':
        return <Target className="h-4 w-4" />
      default:
        return <CheckSquare className="h-4 w-4" />
    }
  }

  const getRuleColor = (ruleType?: string) => {
    switch (ruleType) {
      case 'PERCENTAGE':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'SPECIFIC':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'HYBRID':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'REJECTED':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getApprovalProgress = (expense: ExpenseWithFlow) => {
    if (!expense.approvalFlow) return { completed: 0, total: 0, percentage: 0 }
    
    const steps = expense.approvalFlow.steps
    const completed = steps.filter(step => step.status === 'APPROVED').length
    const total = steps.length
    const percentage = total > 0 ? (completed / total) * 100 : 0
    
    return { completed, total, percentage }
  }

  const canApprove = (expense: ExpenseWithFlow) => {
    if (!expense.approvalFlow) return false
    return expense.approvalFlow.steps.some(
      step => step.approver.id === user.id && step.status === 'PENDING'
    )
  }

  const myPendingCount = expenses.filter(expense => canApprove(expense)).length

  if (!session) {
    return <div>Please log in to view approvals.</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Expense Approvals</h1>
            <p className="text-muted-foreground">
              Review and approve expense submissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Timer className="h-3 w-3" />
            {myPendingCount} pending your approval
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expenses</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="my_pending">My Pending Approvals</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No expenses to review</p>
            <p className="text-sm">Expenses requiring approval will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {expenses.map((expense) => {
              const progress = getApprovalProgress(expense)
              const userCanApprove = canApprove(expense)
              
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`border rounded-lg p-6 ${userCanApprove ? 'border-primary/20 bg-primary/5' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{expense.category}</h3>
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(expense.status)}
                            >
                              {expense.status}
                            </Badge>
                            {userCanApprove && (
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                Awaiting Your Approval
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {expense.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {formatCurrency(expense.amount, expense.currency)}
                          </p>
                          {expense.convertedAmount && expense.currency !== 'USD' && (
                            <p className="text-sm text-muted-foreground">
                              ≈ {formatCurrency(expense.convertedAmount, 'USD')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Employee & Date Info */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{expense.submittedBy.name}</p>
                            <p className="text-xs text-muted-foreground">{expense.submittedBy.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">Expense: {formatDate(expense.date)}</p>
                            <p className="text-xs text-muted-foreground">
                              Submitted: {formatDate(expense.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Approval Flow */}
                      {expense.approvalFlow && (
                        <div className="space-y-3">
                          {/* Rule Info */}
                          {expense.approvalFlow.rule && (
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${getRuleColor(expense.approvalFlow.rule.ruleType)}`}>
                                {getRuleIcon(expense.approvalFlow.rule.ruleType)}
                              </div>
                              <span className="text-sm font-medium">
                                {expense.approvalFlow.rule.name}
                              </span>
                              {expense.approvalFlow.rule.ruleType === 'PERCENTAGE' && (
                                <Badge variant="outline" className="text-xs">
                                  {expense.approvalFlow.rule.percentageThreshold}% required
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Approval Progress</span>
                              <span>{progress.completed}/{progress.total} approved</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Approval Steps */}
                          <div className="space-y-2">
                            {expense.approvalFlow.steps.map((step, index) => (
                              <div key={step.id} className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {step.status === 'APPROVED' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : step.status === 'REJECTED' ? (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {step.approver.name}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getStatusColor(step.status)}`}
                                  >
                                    {step.status}
                                  </Badge>
                                </div>
                                {step.comment && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MessageCircle className="h-3 w-3" />
                                    {step.comment}
                                  </div>
                                )}
                                {step.approvedAt && (
                                  <div className="text-xs text-muted-foreground ml-auto">
                                    {formatDate(step.approvedAt)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedExpense(expense)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Expense</DialogTitle>
            <DialogDescription>
              Approve or reject this expense submission
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-6">
              {/* Expense Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedExpense.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Employee</Label>
                  <p className="font-medium">{selectedExpense.submittedBy.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{formatDate(selectedExpense.date)}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p>{selectedExpense.description}</p>
              </div>

              {/* Approval Flow Status */}
              {selectedExpense.approvalFlow && (
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    <span className="font-medium">Approval Flow</span>
                  </div>
                  {selectedExpense.approvalFlow.steps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {step.status === 'APPROVED' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : step.status === 'REJECTED' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <span>{step.approver.name}</span>
                      </div>
                      <Badge variant="outline" className={getStatusColor(step.status)}>
                        {step.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {canApprove(selectedExpense) && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="comment">Comment (Optional)</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                      placeholder="Add your comments..."
                      rows={3}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleApprovalAction('REJECTED')}
                      disabled={actionLoading}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprovalAction('APPROVED')}
                      disabled={actionLoading}
                      className="gap-2"
                    >
                      {actionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
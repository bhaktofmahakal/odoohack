'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Settings, 
  Building,
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  UserCheck,
  Percent
} from 'lucide-react'

interface ApprovalRule {
  id?: string
  name: string
  ruleType: 'PERCENTAGE' | 'SPECIFIC' | 'HYBRID'
  percentageThreshold?: number
  specificApproverId?: string
  isManagerFirst: boolean
  minAmount?: number
  maxAmount?: number
  isActive: boolean
  companyId?: string
  createdAt?: string
  updatedAt?: string
  _count?: {
    approvalFlows: number
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null)
  const [formData, setFormData] = useState<Partial<ApprovalRule>>({
    name: '',
    ruleType: 'PERCENTAGE',
    percentageThreshold: 60,
    specificApproverId: '',
    isManagerFirst: false,
    minAmount: 0,
    maxAmount: 0,
    isActive: true
  })

  const user = session?.user as any

  // Only allow admin users
  if (!session || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Only administrators can access settings.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchApprovalRules()
    fetchUsers()
  }, [])

  const fetchApprovalRules = async () => {
    try {
      const response = await fetch('/api/approval-rules')
      if (response.ok) {
        const data = await response.json()
        setApprovalRules(data)
      }
    } catch (error) {
      console.error('Error fetching approval rules:', error)
      toast.error('Failed to load approval rules')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter((u: User) => u.role === 'MANAGER' || u.role === 'ADMIN'))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.ruleType) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.ruleType === 'PERCENTAGE' && !formData.percentageThreshold) {
      toast.error('Percentage threshold is required for percentage rules')
      return
    }

    if (formData.ruleType === 'SPECIFIC' && !formData.specificApproverId) {
      toast.error('Specific approver is required for specific rules')
      return
    }

    setLoading(true)
    try {
      const url = editingRule ? `/api/approval-rules/${editingRule.id}` : '/api/approval-rules'
      const method = editingRule ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingRule ? 'Rule updated successfully!' : 'Rule created successfully!')
        fetchApprovalRules()
        resetForm()
        setIsDialogOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save rule')
      }
    } catch (error) {
      toast.error('Failed to save rule')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rule: ApprovalRule) => {
    setEditingRule(rule)
    setFormData({ ...rule })
    setIsDialogOpen(true)
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/approval-rules/${ruleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Rule deleted successfully!')
        fetchApprovalRules()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete rule')
      }
    } catch (error) {
      toast.error('Failed to delete rule')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingRule(null)
    setFormData({
      name: '',
      ruleType: 'PERCENTAGE',
      percentageThreshold: 60,
      specificApproverId: '',
      isManagerFirst: false,
      minAmount: 0,
      maxAmount: 0,
      isActive: true
    })
  }

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="h-4 w-4" />
      case 'SPECIFIC':
        return <UserCheck className="h-4 w-4" />
      case 'HYBRID':
        return <Target className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getRuleTypeColor = (type: string) => {
    switch (type) {
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

  const getRuleDescription = (rule: ApprovalRule) => {
    let desc = ''
    
    if (rule.ruleType === 'PERCENTAGE') {
      desc = `${rule.percentageThreshold}% of approvers must approve`
    } else if (rule.ruleType === 'SPECIFIC') {
      const approver = users.find(u => u.id === rule.specificApproverId)
      desc = `${approver?.name || 'Unknown'} must approve`
    } else if (rule.ruleType === 'HYBRID') {
      const approver = users.find(u => u.id === rule.specificApproverId)
      desc = `${rule.percentageThreshold}% or ${approver?.name || 'Unknown'} must approve`
    }

    if (rule.minAmount && rule.maxAmount) {
      desc += ` (${rule.minAmount} - ${rule.maxAmount})`
    } else if (rule.minAmount) {
      desc += ` (min: ${rule.minAmount})`
    } else if (rule.maxAmount) {
      desc += ` (max: ${rule.maxAmount})`
    }

    return desc
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Approval Rules Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Approval Rules
              </CardTitle>
              <CardDescription>
                Configure automated approval workflows for expense claims
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Approval Rule' : 'Create New Approval Rule'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure the conditions and approvers for expense approvals
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Rule Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g., Standard Manager Approval"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ruleType">Rule Type *</Label>
                        <Select
                          value={formData.ruleType}
                          onValueChange={(value: string) =>
                            setFormData({ ...formData, ruleType: value as 'PERCENTAGE' | 'SPECIFIC' | 'HYBRID' })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE">Percentage Based</SelectItem>
                            <SelectItem value="SPECIFIC">Specific Approver</SelectItem>
                            <SelectItem value="HYBRID">Hybrid (Both)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Rule Type Specific Fields */}
                    {(formData.ruleType === 'PERCENTAGE' || formData.ruleType === 'HYBRID') && (
                      <div>
                        <Label htmlFor="percentage">Percentage Threshold (%)</Label>
                        <Input
                          id="percentage"
                          type="number"
                          min="1"
                          max="100"
                          value={formData.percentageThreshold || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData({ ...formData, percentageThreshold: parseFloat(e.target.value) })
                          }
                          placeholder="60"
                        />
                      </div>
                    )}

                    {(formData.ruleType === 'SPECIFIC' || formData.ruleType === 'HYBRID') && (
                      <div>
                        <Label htmlFor="approver">Specific Approver</Label>
                        <Select
                          value={formData.specificApproverId}
                          onValueChange={(value: string) =>
                            setFormData({ ...formData, specificApproverId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an approver" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Amount Limits */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minAmount">Minimum Amount</Label>
                        <Input
                          id="minAmount"
                          type="number"
                          min="0"
                          value={formData.minAmount || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxAmount">Maximum Amount</Label>
                        <Input
                          id="maxAmount"
                          type="number"
                          min="0"
                          value={formData.maxAmount || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData({ ...formData, maxAmount: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="Leave empty for no limit"
                        />
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Manager First</Label>
                          <p className="text-sm text-muted-foreground">
                            Require direct manager approval before applying this rule
                          </p>
                        </div>
                        <Switch
                          checked={formData.isManagerFirst}
                          onCheckedChange={(checked: boolean) =>
                            setFormData({ ...formData, isManagerFirst: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Active Rule</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable this rule for new expense submissions
                          </p>
                        </div>
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked: boolean) =>
                            setFormData({ ...formData, isActive: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {editingRule ? 'Update Rule' : 'Create Rule'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {approvalRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No approval rules configured yet</p>
              <p className="text-sm">Create your first rule to automate expense approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvalRules.map((rule) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getRuleTypeColor(rule.ruleType)}`}>
                        {getRuleTypeIcon(rule.ruleType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={getRuleTypeColor(rule.ruleType)}
                          >
                            {rule.ruleType}
                          </Badge>
                          {rule.isManagerFirst && (
                            <Badge variant="outline" className="text-xs">
                              Manager First
                            </Badge>
                          )}
                          <Badge 
                            variant={rule.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getRuleDescription(rule)}
                        </p>
                        {rule._count && rule._count.approvalFlows > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Used by {rule._count.approvalFlows} expenses
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rule.id && handleDelete(rule.id)}
                        disabled={rule._count && rule._count.approvalFlows > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Company</p>
              <p className="font-medium">{user.company?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Your Role</p>
              <p className="font-medium">{user.role}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Active Rules</p>
              <p className="font-medium">{approvalRules.filter(r => r.isActive).length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Rules</p>
              <p className="font-medium">{approvalRules.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { 
  Users, 
  UserPlus,
  Mail,
  Shield,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  avatar?: string
  joinedAt: string
  lastActive: string
  manager?: string
  totalExpenses: number
  monthlyExpenses: number
  status: 'ACTIVE' | 'INACTIVE'
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'EMPLOYEE',
    joinedAt: '2024-01-10',
    lastActive: '2024-01-15',
    manager: 'Sarah Wilson',
    totalExpenses: 12450.00,
    monthlyExpenses: 1250.00,
    status: 'ACTIVE'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'EMPLOYEE',
    joinedAt: '2024-01-08',
    lastActive: '2024-01-14',
    manager: 'Sarah Wilson',
    totalExpenses: 8750.00,
    monthlyExpenses: 875.00,
    status: 'ACTIVE'
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@company.com',
    role: 'MANAGER',
    joinedAt: '2023-12-15',
    lastActive: '2024-01-15',
    totalExpenses: 15200.00,
    monthlyExpenses: 1520.00,
    status: 'ACTIVE'
  },
  {
    id: '4',
    name: 'Emily Brown',
    email: 'emily.brown@company.com',
    role: 'EMPLOYEE',
    joinedAt: '2024-01-05',
    lastActive: '2024-01-12',
    manager: 'Mike Davis',
    totalExpenses: 3200.00,
    monthlyExpenses: 320.00,
    status: 'ACTIVE'
  }
]

export default function TeamPage() {
  const { data: session } = useSession()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE' as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
    manager: ''
  })

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team')
      if (!response.ok) throw new Error('Failed to fetch team members')
      const data = await response.json()
      setTeamMembers(data)
    } catch (error) {
      console.error('Error fetching team members:', error)
      // Fallback to mock data
      setTeamMembers(mockTeamMembers)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || member.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const managerId = newMember.manager ? 
        teamMembers.find(m => m.name === newMember.manager)?.id : null

      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMember,
          managerId
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add team member')
      }

      const member = await response.json()
      setTeamMembers(prev => [...prev, member])
      setNewMember({ name: '', email: '', role: 'EMPLOYEE', manager: '' })
      setIsAddingMember(false)
      
      toast.success('Team member added successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add team member. Please try again.')
    }
  }

  const handleUpdateMember = async () => {
    if (!editingMember) return

    try {
      const response = await fetch(`/api/team/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingMember),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update team member')
      }

      const updatedMember = await response.json()
      setTeamMembers(prev => 
        prev.map(member => 
          member.id === editingMember.id ? updatedMember : member
        )
      )
      
      setEditingMember(null)
      toast.success('Team member updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update team member. Please try again.')
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove team member')
      }
      
      setTeamMembers(prev => prev.filter(member => member.id !== memberId))
      toast.success('Team member removed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove team member. Please try again.')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'MANAGER': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'EMPLOYEE': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const managers = teamMembers.filter(member => member.role === 'MANAGER' || member.role === 'ADMIN')

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">Manage your team members and their roles</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-muted rounded-full"></div>
                    <div>
                      <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
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
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage your team members and their roles</p>
        </div>
        
        <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <UserPlus className="h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Add a new team member to your organization
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@company.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={newMember.role} 
                  onValueChange={(value: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') => 
                    setNewMember(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newMember.role === 'EMPLOYEE' && (
                <div>
                  <Label htmlFor="manager">Manager</Label>
                  <Select 
                    value={newMember.manager} 
                    onValueChange={(value: string) => setNewMember(prev => ({ ...prev, manager: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.name}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingMember(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember}>Add Member</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-lg font-semibold">{teamMembers.length}</p>
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
                  <Shield className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Managers</p>
                  <p className="text-lg font-semibold">
                    {teamMembers.filter(m => m.role === 'MANAGER' || m.role === 'ADMIN').length}
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
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="text-lg font-semibold">
                    {teamMembers.filter(m => m.role === 'EMPLOYEE').length}
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
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Monthly</p>
                  <p className="text-lg font-semibold">
                    ${(teamMembers.reduce((sum, m) => sum + m.monthlyExpenses, 0) / teamMembers.length || 0).toLocaleString()}
                  </p>
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
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-base">{member.name}</h3>
                          <Badge variant="outline" className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-48">{member.email}</span>
                          </div>
                          {member.manager && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>Reports to {member.manager}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:items-end">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                        <p className="font-semibold text-lg">${member.monthlyExpenses.toLocaleString()}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => setEditingMember(member)}
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Team Member</DialogTitle>
                              <DialogDescription>
                                Update team member information
                              </DialogDescription>
                            </DialogHeader>
                            
                            {editingMember && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name">Full Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editingMember.name}
                                    onChange={(e) => setEditingMember(prev => 
                                      prev ? { ...prev, name: e.target.value } : null
                                    )}
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="edit-email">Email</Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    value={editingMember.email}
                                    onChange={(e) => setEditingMember(prev => 
                                      prev ? { ...prev, email: e.target.value } : null
                                    )}
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="edit-role">Role</Label>
                                  <Select 
                                    value={editingMember.role} 
                                    onValueChange={(value: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') => 
                                      setEditingMember(prev => 
                                        prev ? { ...prev, role: value } : null
                                      )
                                    }
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                      <SelectItem value="MANAGER">Manager</SelectItem>
                                      <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {editingMember.role === 'EMPLOYEE' && (
                                  <div>
                                    <Label htmlFor="edit-manager">Manager</Label>
                                    <Select 
                                      value={editingMember.manager || ''} 
                                      onValueChange={(value: string) => setEditingMember(prev => 
                                        prev ? { ...prev, manager: value } : null
                                      )}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select a manager" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {managers.filter(m => m.id !== editingMember.id).map((manager) => (
                                          <SelectItem key={manager.id} value={manager.name}>
                                            {manager.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingMember(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateMember}>Update Member</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredMembers.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No team members found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || roleFilter !== 'ALL'
                  ? "Try adjusting your filters"
                  : "Get started by adding your first team member"
                }
              </p>
              {!searchQuery && roleFilter === 'ALL' && (
                <Button className="gap-2" onClick={() => setIsAddingMember(true)}>
                  <UserPlus className="h-4 w-4" />
                  Add Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
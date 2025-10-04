'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Receipt, 
  Users, 
  Settings, 
  LogOut,
  Home,
  Plus,
  CheckSquare,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const user = session.user as any

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: pathname === '/dashboard' },
    { name: 'Submit Expense', href: '/dashboard/expenses/new', icon: Plus, current: pathname === '/dashboard/expenses/new' },
    { name: 'My Expenses', href: '/dashboard/expenses', icon: Receipt, current: pathname.startsWith('/dashboard/expenses') && pathname !== '/dashboard/expenses/new' },
  ]

  // Add manager/admin specific navigation
  if (user.role === 'MANAGER' || user.role === 'ADMIN') {
    navigation.push(
      { name: 'Approvals', href: '/dashboard/approvals', icon: CheckSquare, current: pathname === '/dashboard/approvals' }
    )
  }

  if (user.role === 'ADMIN') {
    navigation.push(
      { name: 'Team', href: '/dashboard/team', icon: Users, current: pathname === '/dashboard/team' },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, current: pathname === '/dashboard/analytics' },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings, current: pathname === '/dashboard/settings' }
    )
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'MANAGER': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'EMPLOYEE': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ExpenseFlow</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={item.current ? "secondary" : "ghost"}
                    className={`gap-2 ${item.current ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {/* User Info Card */}
            <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-lg px-1 py-2 shadow-sm">
              <div className="text-right hidden md:block min-w-0 max-w-[140px]">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.company?.name || 'ExpenseFlow'}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className={`${getRoleColor(user.role)} font-medium shrink-0`}
              >
                {user.role}
              </Badge>
            </div>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-16 z-40 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container py-2">
          <div className="flex gap-1 overflow-x-auto">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={item.current ? "secondary" : "ghost"}
                  size="sm"
                  className={`gap-2 whitespace-nowrap ${item.current ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
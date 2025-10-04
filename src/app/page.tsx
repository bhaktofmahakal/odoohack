'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { Receipt, ArrowRight, Users, Globe, FileText } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-16 space-y-16">
        {/* Hero Section */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center space-y-6"
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-4 rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-12 w-12" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ExpenseFlow
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your expense management with intelligent workflows, OCR receipt scanning, 
            and multi-level approval systems. Built for modern teams.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center pt-8">
            <Link href="/auth/signin">
              <Button size="lg" className="gap-2 h-12 px-8 text-lg">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-lg">
              <FileText className="h-5 w-5" />
              View Demo
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              title: 'Smart OCR Scanning',
              description: 'Upload receipt images and automatically extract amount, date, merchant, and category using advanced AI.',
              icon: <Receipt className="h-8 w-8" />,
              color: 'bg-blue-500/10 text-blue-500'
            },
            {
              title: 'Flexible Approval Workflows',
              description: 'Configure percentage-based, specific approver, or hybrid approval rules. Multi-level sequential approvals.',
              icon: <Users className="h-8 w-8" />,
              color: 'bg-green-500/10 text-green-500'
            },
            {
              title: 'Multi-Currency Support',
              description: 'Handle expenses in any currency with real-time conversion to your company\'s base currency.',
              icon: <Globe className="h-8 w-8" />,
              color: 'bg-purple-500/10 text-purple-500'
            },
          ].map((feature, index) => (
            <motion.div key={feature.title} variants={fadeInUp}>
              <Card className="glass-card h-full hover:glow-effect transition-all duration-300">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Key Features */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          className="text-center space-y-8"
        >
          <h2 className="text-3xl font-bold">Everything You Need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            {[
              "🔐 Google OAuth Authentication with auto company creation",
              "👥 Role-based access control (Admin, Manager, Employee)",
              "📸 OCR receipt scanning with Google Cloud Vision",
              "💰 Multi-currency support with real-time conversion",
              "⚡ Intelligent approval workflows and rules",
              "📊 Real-time analytics and reporting",
              "📱 Mobile-responsive design",
              "🌍 Auto-detect location and currency on signup"
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/20">
                <span className="text-lg">{feature.split(' ')[0]}</span>
                <span className="text-muted-foreground">{feature.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
          className="text-center space-y-6"
        >
          <Card className="glass-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-base">
                Sign in with Google to create your company and start managing expenses intelligently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/signin">
                <Button size="lg" className="w-full h-12 text-lg">
                  Sign In with Google
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
'use client'

import { signIn, getSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fadeInUp } from "@/lib/animations"
import { Chrome, Receipt } from "lucide-react"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true
      })
      
      if (result?.error) {
        console.error('Sign in error:', result.error)
      }
    } catch (error) {
      console.error('Sign in failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="glass-card">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-xl bg-primary/10 text-primary">
                <Receipt className="h-12 w-12" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome to ExpenseFlow
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to manage your expenses with intelligent workflows and OCR receipt scanning
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium"
              size="lg"
              animate
            >
              <Chrome className="h-5 w-5 mr-3" />
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </Button>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  First time signing up?
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                    <span>Company auto-created with your location currency</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                    <span>You become the Admin user</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                    <span>Create employees and managers</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from './card'
import { cn, getInitials } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/lib/animations'

interface ApprovalStep {
  id: string
  stepNumber: number
  approverName: string
  approverAvatar?: string
  status: 'pending' | 'approved' | 'rejected' | 'current'
  timestamp?: Date
  comment?: string
}

interface ApprovalFlowVisualizerProps {
  steps: ApprovalStep[]
  className?: string
}

export function ApprovalFlowVisualizer({ steps, className }: ApprovalFlowVisualizerProps) {
  const getStepIcon = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'current':
        return <Clock className="h-5 w-5 text-warning animate-pulse" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStepColor = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'approved':
        return 'border-success bg-success/5'
      case 'rejected':
        return 'border-destructive bg-destructive/5'
      case 'current':
        return 'border-warning bg-warning/5 glow-effect'
      default:
        return 'border-muted bg-muted/5'
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Approval Flow</h3>
          
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={fadeInUp}
                className={cn(
                  'relative p-4 rounded-lg border transition-all duration-300',
                  getStepColor(step.status)
                )}
              >
                {/* Connection line to next step */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-full w-px h-4 bg-border z-0" />
                )}

                <div className="flex items-start gap-4">
                  {/* Step indicator */}
                  <div className="flex-shrink-0">
                    <div className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                      step.status === 'approved' ? 'border-success bg-success/10' :
                      step.status === 'rejected' ? 'border-destructive bg-destructive/10' :
                      step.status === 'current' ? 'border-warning bg-warning/10' :
                      'border-muted bg-muted/10'
                    )}>
                      {step.approverAvatar ? (
                        <img 
                          src={step.approverAvatar} 
                          alt={step.approverName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                          {getInitials(step.approverName)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">
                        Step {step.stepNumber}: {step.approverName}
                      </h4>
                      {getStepIcon(step.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.status === 'current' ? 'Waiting for approval' :
                       step.status === 'approved' ? 'Approved' :
                       step.status === 'rejected' ? 'Rejected' :
                       'Pending'}
                    </p>

                    {step.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {step.timestamp.toLocaleDateString()} at {step.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}

                    {step.comment && (
                      <div className="mt-3 p-3 rounded-md bg-background/50 border">
                        <p className="text-sm italic">"{step.comment}"</p>
                      </div>
                    )}
                  </div>

                  {/* Status animation for current step */}
                  {step.status === 'current' && (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="absolute top-4 right-4 w-3 h-3 bg-warning rounded-full"
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Summary */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">
                {steps.filter(s => s.status === 'approved').length} of {steps.length} approved
              </span>
            </div>
            <div className="mt-2 h-2 bg-muted/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(steps.filter(s => s.status === 'approved').length / steps.length) * 100}%`
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
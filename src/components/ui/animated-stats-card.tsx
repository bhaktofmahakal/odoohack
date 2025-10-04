'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from './card'
import { cn, formatCurrency } from '@/lib/utils'
import { fadeInUp, scaleIn } from '@/lib/animations'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface AnimatedStatsCardProps {
  title: string
  value: string | number
  currency?: string
  previousValue?: number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
  delay?: number
  animate?: boolean
}

export function AnimatedStatsCard({
  title,
  value,
  currency,
  previousValue,
  icon,
  trend = 'neutral',
  trendValue,
  className,
  delay = 0,
  animate = true,
}: AnimatedStatsCardProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  const formattedValue = currency ? formatCurrency(numValue, currency) : value.toString()

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay,
        ease: 'easeOut',
      },
    },
  }

  const valueVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: delay + 0.2,
        type: 'spring',
        stiffness: 100,
      },
    },
  }

  return (
    <motion.div
      variants={animate ? cardVariants : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
      whileHover={{ 
        y: -4, 
        transition: { duration: 0.2, ease: 'easeOut' } 
      }}
    >
      <Card className={cn('glass-card glow-effect', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {icon && (
              <motion.div
                variants={animate ? scaleIn : undefined}
                initial={animate ? 'hidden' : undefined}
                animate={animate ? 'visible' : undefined}
                className="p-2 rounded-lg bg-primary/10 text-primary"
              >
                {icon}
              </motion.div>
            )}
          </div>
          
          <motion.div
            variants={animate ? valueVariants : undefined}
            initial={animate ? 'hidden' : undefined}
            animate={animate ? 'visible' : undefined}
          >
            <div className="text-3xl font-bold font-mono tracking-tight mb-2">
              {formattedValue}
            </div>
          </motion.div>

          {(trend !== 'neutral' || trendValue) && (
            <motion.div
              initial={animate ? { opacity: 0, x: -10 } : undefined}
              animate={animate ? { 
                opacity: 1, 
                x: 0,
                transition: { delay: delay + 0.4, duration: 0.3 }
              } : undefined}
              className="flex items-center gap-1 text-sm"
            >
              {trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4" />}
              <span className={cn(trendColors[trend])}>
                {trendValue || (trend === 'up' ? '+' : trend === 'down' ? '-' : '')}
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </motion.div>
          )}

          {/* Animated progress bar for visual appeal */}
          <motion.div
            className="mt-4 h-1 bg-muted/20 rounded-full overflow-hidden"
            initial={animate ? { opacity: 0 } : undefined}
            animate={animate ? {
              opacity: 1,
              transition: { delay: delay + 0.6, duration: 0.3 }
            } : undefined}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={animate ? { width: 0 } : { width: '100%' }}
              animate={animate ? {
                width: `${Math.min(Math.max((numValue / (previousValue || numValue)) * 100, 0), 100)}%`,
                transition: { 
                  delay: delay + 0.8, 
                  duration: 1, 
                  ease: 'easeOut' 
                }
              } : undefined}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
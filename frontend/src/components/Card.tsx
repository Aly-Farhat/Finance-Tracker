import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border border-border bg-card p-6 premium-shadow backdrop-blur-sm paper-texture',
        hover && 'transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: ReactNode
  trend?: 'up' | 'down'
  variant?: 'green' | 'red' | 'blue' | 'purple'
  changeUnit?: string // Optional: default is "%", can be "pts" for percentage points
}

export function StatCard({ title, value, change, icon, trend, variant = 'green', changeUnit = '%' }: StatCardProps) {
  const colorConfig = {
    green: {
      text: 'text-green-500',
      bg: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
      icon: 'text-green-500',
      glow: 'glow-green',
      bar: 'linear-gradient(90deg, transparent, #10b981, transparent)'
    },
    red: {
      text: 'text-red-500',
      bg: 'bg-gradient-to-br from-red-500/20 to-rose-500/20',
      icon: 'text-red-500',
      glow: 'glow-red',
      bar: 'linear-gradient(90deg, transparent, #ef4444, transparent)'
    },
    blue: {
      text: 'text-blue-500',
      bg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      icon: 'text-blue-500',
      glow: 'glow-blue',
      bar: 'linear-gradient(90deg, transparent, #3b82f6, transparent)'
    },
    purple: {
      text: 'text-purple-500',
      bg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
      icon: 'text-purple-500',
      glow: 'glow-purple',
      bar: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)'
    }
  }

  const colors = colorConfig[variant]

  return (
    <Card hover className="relative overflow-hidden">
      {/* Fixed icon in top-right corner */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={cn(
          'absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-sm flex-shrink-0',
          colors.bg,
          colors.icon,
          colors.glow
        )}
      >
        {icon}
      </motion.div>

      {/* Content area */}
      <div className="pr-12 min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">{title}</p>
        <motion.h3
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="font-bold mt-1 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            fontSize: String(value).length > 15 ? '1.25rem' : 
                      String(value).length > 13 ? '1.5rem' : 
                      String(value).length > 11 ? '1.75rem' : 
                      String(value).length > 9 ? '2rem' : '2.25rem'
          }}
        >
          {value}
        </motion.h3>
        {change !== undefined && !isNaN(change) && (
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={cn(
              'text-xs mt-2 font-semibold whitespace-nowrap overflow-hidden text-ellipsis',
              colors.text
            )}
          >
            <span className="inline-block text-sm mr-1">
              {trend === 'up' ? '↗' : '↘'}
            </span>
            {change > 0 ? '+' : ''}
            {Math.abs(change) < 0.1 && change !== 0 ? change.toFixed(2) : change.toFixed(1)}{changeUnit} from last month
          </motion.p>
        )}
      </div>
    </Card>
  )
}


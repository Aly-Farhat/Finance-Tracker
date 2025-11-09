import { motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { Button } from './Button'

interface ErrorAlertProps {
  message: string
  onClose?: () => void
  onRetry?: () => void
}

export function ErrorAlert({ message, onClose, onRetry }: ErrorAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="text-destructive mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h4 className="font-medium text-destructive mb-1">Error</h4>
          <p className="text-sm text-muted-foreground">{message}</p>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="mt-3"
            >
              Try Again
            </Button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </motion.div>
  )
}


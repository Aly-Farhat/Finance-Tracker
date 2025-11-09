import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  const variantStyles = {
    danger: 'text-destructive',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              aria-describedby="dialog-description"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full bg-${variant === 'danger' ? 'destructive' : variant === 'warning' ? 'yellow' : 'blue'}/10`}>
                  <AlertTriangle className={variantStyles[variant]} size={24} />
                </div>
                <div className="flex-1">
                  <h3 id="dialog-title" className="text-lg font-semibold mb-2">
                    {title}
                  </h3>
                  <p id="dialog-description" className="text-sm text-muted-foreground mb-6">
                    {message}
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="ghost"
                      onClick={onCancel}
                      disabled={isLoading}
                    >
                      {cancelText}
                    </Button>
                    <Button
                      variant={variant === 'danger' ? 'destructive' : 'primary'}
                      onClick={onConfirm}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : confirmText}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}


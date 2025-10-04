import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { toastSlide } from "@/lib/animations"

export interface Toast {
  id: string
  title?: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(current => [...current, newToast])

    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      setToasts(current => current.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(current => current.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastStyles = {
  success: 'border-success/20 bg-success/10 text-success',
  error: 'border-destructive/20 bg-destructive/10 text-destructive',
  warning: 'border-warning/20 bg-warning/10 text-warning',
  info: 'border-primary/20 bg-primary/10 text-primary',
}

function ToastComponent({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = toastIcons[toast.type || 'info']
  
  return (
    <motion.div
      variants={toastSlide}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-lg border p-4 shadow-lg backdrop-blur-sm",
        toastStyles[toast.type || 'info']
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {toast.title && (
            <div className="font-medium text-sm">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90 mt-1">{toast.description}</div>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

export function Toast() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
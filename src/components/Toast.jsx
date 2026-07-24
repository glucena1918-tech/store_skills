import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const COLORS = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  info: 'var(--color-accent)',
}

export default function Toast({ message, type = 'info', onClose }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  const Icon = ICONS[type] || ICONS.info
  const color = COLORS[type] || COLORS.info

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setVisible(true))

    // Auto-dismiss after 3.5s
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(onClose, 300)
    }, 3500)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      id="toast-notification"
      className="fixed bottom-6 right-6 z-[200] max-w-sm"
      style={{
        transform: visible && !exiting ? 'translateY(0)' : 'translateY(20px)',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="flex items-start gap-3 bg-[var(--color-bg-primary)] rounded-2xl p-4 pr-3
                      shadow-2xl border border-[var(--color-border)]">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color }} />
        <p className="text-sm text-[var(--color-text-primary)] leading-snug flex-1">
          {message}
        </p>
        <button
          onClick={() => {
            setExiting(true)
            setTimeout(onClose, 300)
          }}
          className="p-1 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors duration-200 cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
        </button>
      </div>
    </div>
  )
}

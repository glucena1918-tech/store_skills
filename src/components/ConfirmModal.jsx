import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({ skill, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onCancel])

  if (!skill) return null

  return (
    <div
      id="confirm-modal-overlay"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      onClick={onCancel}
      style={{
        animation: 'fadeIn 0.2s ease',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        id="confirm-modal-box"
        className="relative spring-transition"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '440px',
          padding: '32px',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--color-border)',
          animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
          textAlign: 'center',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute cursor-pointer transition-colors duration-200"
          style={{
            top: '16px',
            right: '16px',
            padding: '8px',
            borderRadius: '50%',
            background: 'var(--color-bg-secondary)',
            border: 'none',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X style={{ width: '15px', height: '15px' }} />
        </button>

        {/* Warning Icon Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(255, 59, 48, 0.1)',
          color: 'var(--color-error)',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(255, 59, 48, 0.15)',
        }}>
          <AlertTriangle style={{ width: '32px', height: '32px' }} />
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '22px',
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '10px',
        }}>
          ¿Eliminar {skill.name}?
        </h3>

        {/* Warning Description */}
        <p style={{
          fontSize: '14.5px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
          marginBottom: '28px',
        }}>
          Esta acción eliminará la herramienta del directorio de forma permanente. <strong style={{ color: 'var(--color-error)', fontWeight: 650 }}>La información guardada no se podrá recuperar.</strong>
        </p>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            id="confirm-cancel-btn"
            type="button"
            onClick={onCancel}
            className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
            style={{
              flex: 1,
              height: '48px',
              borderRadius: '14px',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-secondary)'
            }}
          >
            Cancelar
          </button>

          <button
            id="confirm-delete-btn"
            type="button"
            onClick={onConfirm}
            className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
            style={{
              flex: 1,
              height: '48px',
              borderRadius: '14px',
              background: 'var(--color-error)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              boxShadow: '0 4px 14px rgba(255, 59, 48, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e02d23'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-error)'
            }}
          >
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

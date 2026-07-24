import { X, Copy, Check, ExternalLink, Star as StarIcon, Calendar, Code2, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import StarRating from './StarRating'

function formatStars(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
  return count.toString()
}

export default function SkillModal({ skill, onClose, onDelete }) {
  const [copied, setCopied] = useState(false)
  const [copiedExample, setCopiedExample] = useState(false)
  const [githubHovered, setGithubHovered] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleCopy = async () => {
    if (!skill.install_command) return
    try {
      await navigator.clipboard.writeText(skill.install_command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar comando:', err)
    }
  }

  const handleCopyExample = async () => {
    if (!skill.example_usage) return
    try {
      await navigator.clipboard.writeText(skill.example_usage)
      setCopiedExample(true)
      setTimeout(() => setCopiedExample(false), 2000)
    } catch (err) {
      console.error('Error al copiar ejemplo:', err)
    }
  }

  if (!skill) return null

  return (
    <div
      id="skill-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      style={{
        animation: 'fadeIn 0.2s ease',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Modal Container */}
      <div
        id="skill-modal-content"
        className="relative spring-transition"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--color-border)',
          animation: 'fadeInScale 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Close Button */}
        <button
          id="modal-close-btn"
          onClick={onClose}
          className="absolute cursor-pointer transition-colors duration-200"
          style={{
            top: '20px',
            right: '20px',
            padding: '8px',
            borderRadius: '50%',
            background: 'var(--color-bg-secondary)',
            border: 'none',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--color-bg-tertiary)'
            e.target.style.color = 'var(--color-text-primary)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--color-bg-secondary)'
            e.target.style.color = 'var(--color-text-secondary)'
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>

        {/* Modal Padding Area */}
        <div style={{ padding: '36px' }}>
          
          {/* Header Row: Category Tag + GitHub Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 650,
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {skill.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 550 }}>
              <StarIcon style={{ width: '14px', height: '14px', fill: 'var(--color-star)', color: 'var(--color-star)' }} />
              <span>{formatStars(skill.stars)} estrellas</span>
            </div>
          </div>

          {/* Title */}
          <h2 
            style={{ 
              fontSize: '28px', 
              fontWeight: 800, 
              letterSpacing: '-0.025em', 
              lineHeight: 1.2, 
              color: 'var(--color-text-primary)',
              marginBottom: '10px',
              paddingRight: '30px', /* Avoid overlap with close btn */
            }}
          >
            {skill.name}
          </h2>

          {/* Star Rating Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
            <StarRating rating={skill.rating} size={15} />
            <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
              {skill.rating}/5 — Evaluación IA
            </span>
          </div>

          {/* Description Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: 'var(--color-text-tertiary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              marginBottom: '8px'
            }}>
              Descripción y Funcionamiento
            </h4>
            <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)', lineHeight: 1.65, fontWeight: 400 }}>
              {skill.description}
            </p>
          </div>

          {/* Use Case Section */}
          {skill.use_case && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: 'var(--color-text-tertiary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                marginBottom: '8px'
              }}>
                ¿Cuándo usarla y a quién ayuda?
              </h4>
              <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)', lineHeight: 1.65, fontWeight: 400 }}>
                {skill.use_case}
              </p>
            </div>
          )}

          {/* Practical Example of Use Section */}
          {skill.example_usage && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: 'var(--color-text-tertiary)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Code2 style={{ width: '14px', height: '14px', color: 'var(--color-accent)' }} />
                  Ejemplo Práctico de Uso
                </h4>

                <button
                  type="button"
                  onClick={handleCopyExample}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: copiedExample ? 'rgba(52, 199, 89, 0.1)' : 'var(--color-bg-secondary)',
                    color: copiedExample ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    fontSize: '12px',
                    fontWeight: 550,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedExample ? (
                    <>
                      <Check style={{ width: '12px', height: '12px' }} />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy style={{ width: '12px', height: '12px' }} />
                      Copiar código
                    </>
                  )}
                </button>
              </div>

              <div 
                style={{ 
                  background: '#1d1d1f', 
                  borderRadius: '14px', 
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
                  overflowX: 'auto',
                }}
              >
                <pre style={{ 
                  margin: 0,
                  fontSize: '13px', 
                  color: '#e3e3e8', 
                  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {skill.example_usage}
                </pre>
              </div>
            </div>
          )}

          {/* Install Command Block */}
          {skill.install_command && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: 'var(--color-text-tertiary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                marginBottom: '8px'
              }}>
                Comando de Instalación
              </h4>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: '#1d1d1f', 
                  borderRadius: '12px', 
                  padding: '14px 18px',
                  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.2)'
                }}
              >
                <code style={{ 
                  flexGrow: 1, 
                  fontSize: '13px', 
                  color: '#34c759', 
                  fontFamily: 'monospace', 
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  scrollbarWidth: 'none',
                }}>
                  {skill.install_command}
                </code>
                
                <button
                  id="modal-copy-btn"
                  onClick={handleCopy}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: copied ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: copied ? 'var(--color-success)' : 'rgba(255, 255, 255, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {copied ? <Check style={{ width: '15px', height: '15px' }} /> : <Copy style={{ width: '15px', height: '15px' }} />}
                </button>
              </div>
            </div>
          )}

          {/* Metadata Grid Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            {skill.language && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <Code2 style={{ width: '16px', height: '16px', color: 'var(--color-text-tertiary)' }} />
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0, lineHeight: 1.2 }}>Lenguaje</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{skill.language}</p>
                </div>
              </div>
            )}
            
            {skill.last_updated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <Calendar style={{ width: '16px', height: '16px', color: 'var(--color-text-tertiary)' }} />
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0, lineHeight: 1.2 }}>Actualizado</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{skill.last_updated}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions Row: GitHub Link + Delete Button */}
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <a
              id="modal-github-link"
              href={skill.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer active:scale-[0.98]"
              onMouseEnter={() => setGithubHovered(true)}
              onMouseLeave={() => setGithubHovered(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flexGrow: 1,
                padding: '14px 20px',
                borderRadius: '14px',
                background: githubHovered ? 'var(--color-accent-hover)' : 'var(--color-accent)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 113, 227, 0.25)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <ExternalLink style={{ width: '16px', height: '16px' }} />
              Ver en GitHub
            </a>

            {onDelete && (
              <button
                id="modal-delete-btn"
                type="button"
                onClick={() => onDelete(skill)}
                className="cursor-pointer active:scale-[0.98] transition-all duration-200"
                style={{
                  padding: '0 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 59, 48, 0.08)',
                  color: 'var(--color-error)',
                  border: '1px solid rgba(255, 59, 48, 0.2)',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  shrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'
                }}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
                Eliminar
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

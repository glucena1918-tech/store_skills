import { X, Copy, Check, ExternalLink, Star as StarIcon, Calendar, Code2, Trash2, Shield, Activity, AlertTriangle, Bot, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import StarRating from './StarRating'
import { formatStarsK, formatNumberLatino } from '../utils/format'

export default function SkillModal({ skill, onClose, onDelete, onReevaluate, onUpdate }) {
  const [copied, setCopied] = useState(false)
  const [copiedExample, setCopiedExample] = useState(false)
  const [copiedAgent, setCopiedAgent] = useState(false)
  const [githubHovered, setGithubHovered] = useState(false)
  const [showTrace, setShowTrace] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleReevaluate = async () => {
    if (!onReevaluate) return
    setIsUpdating(true)
    try {
      const result = await onReevaluate(skill.original_url, true)
      if (result.approved && result.skill) {
        if (onUpdate) onUpdate(result.skill)
      } else {
        alert(`La re-evaluación determinó que el repositorio ya no es apto: ${result.reason}`)
      }
    } catch (err) {
      alert(`Error al re-evaluar con IA: ${err.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

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
              <span>{formatStarsK(skill.stars)} estrellas</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StarRating rating={skill.rating} size={15} />
              <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                {skill.rating}/5 — Evaluación IA
              </span>
            </div>

            {/* Collapsible Reasoning Trace Link */}
            {skill.agent_reasoning_trace && skill.agent_reasoning_trace.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowTrace(!showTrace)}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--color-accent)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  {showTrace ? (
                    <>Ocultar dictamen del Agente <ChevronUp style={{ width: '14px', height: '14px' }} /></>
                  ) : (
                    <>Ver dictamen del Agente <ChevronDown style={{ width: '14px', height: '14px' }} /></>
                  )}
                </button>

                {/* Collapsible Trace Content */}
                <div style={{
                  maxHeight: showTrace ? '300px' : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, margin 0.3s ease',
                  opacity: showTrace ? 1 : 0,
                  marginTop: showTrace ? '10px' : '0px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '12px',
                  border: showTrace ? '1px solid var(--color-border)' : '1px solid transparent',
                  padding: showTrace ? '14px 18px' : '0px 18px',
                }}>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {skill.agent_reasoning_trace.map((step, idx) => {
                      // Override dictamen for exception skills
                      const isLastStep = idx === skill.agent_reasoning_trace.length - 1;
                      const displayStep = (isLastStep && skill.is_exception && step.toLowerCase().includes('dictamen'))
                        ? 'Paso 4: Dictamen: Aprobado por Excepción Humana (Human-in-the-Loop) — Bajo el umbral estándar de estrellas.'
                        : step;
                      return (
                        <li key={`trace-${idx}`} style={{
                          fontSize: '13px',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 1.5,
                          fontWeight: 500,
                        }}>
                          {displayStep}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
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

          {/* Agent Integration Prompt Block */}
          {skill.agent_prompt && (
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
                  <Bot style={{ width: '14px', height: '14px', color: 'var(--color-accent)' }} />
                  Prompt de Integración para tu Agente IA
                </h4>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(skill.agent_prompt)
                      setCopiedAgent(true)
                      setTimeout(() => setCopiedAgent(false), 2000)
                    } catch (err) {
                      console.error('Error al copiar prompt:', err)
                    }
                  }}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: copiedAgent ? 'rgba(52, 199, 89, 0.1)' : 'var(--color-bg-secondary)',
                    color: copiedAgent ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    fontSize: '12px',
                    fontWeight: 550,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedAgent ? (
                    <><Check style={{ width: '12px', height: '12px' }} /> ¡Copiado!</>
                  ) : (
                    <><Copy style={{ width: '12px', height: '12px' }} /> Copiar prompt</>
                  )}
                </button>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.06) 0%, rgba(54, 54, 240, 0.06) 100%)',
                borderRadius: '14px',
                padding: '16px 18px',
                border: '1px solid var(--color-border-glow)',
                position: 'relative',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.6,
                  fontWeight: 450,
                  fontStyle: 'italic',
                }}>
                  {skill.agent_prompt}
                </p>
              </div>
            </div>
          )}

          {/* Metadata Grid Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                <Code2 style={{ width: '16px', height: '16px', color: 'var(--color-text-tertiary)' }} />
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0, lineHeight: 1.2 }}>Lenguaje</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>{(!skill.language || skill.language === 'Desconocido') ? 'Markdown / Docs' : skill.language}</p>
                </div>
              </div>
            
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

          {/* Security Audit Section */}
          {(skill.license || skill.maintenance_status || skill.risk_level) && (
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: 'var(--color-text-tertiary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Shield style={{ width: '13px', height: '13px', color: 'var(--color-accent)' }} />
                Auditoría de Seguridad IA
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {/* License */}
                <div style={{ 
                  padding: '12px 14px', 
                  borderRadius: '12px', 
                  background: 'var(--color-accent-soft)', 
                  border: '1px solid var(--color-border-glow)',
                  textAlign: 'center'
                }}>
                  <Shield style={{ width: '18px', height: '18px', color: 'var(--color-accent)', margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Licencia</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)', margin: '2px 0 0' }}>{skill.license || 'No especificada'}</p>
                </div>
                {/* Maintenance */}
                {(() => {
                  const status = skill.maintenance_status || 'Activo';
                  const statusColor = status === 'Activo' ? 'var(--color-success)' : status === 'Mantenimiento' ? 'var(--color-warning)' : 'var(--color-error)';
                  const statusBg = status === 'Activo' ? 'rgba(52, 199, 89, 0.08)' : status === 'Mantenimiento' ? 'rgba(255, 159, 10, 0.08)' : 'rgba(255, 59, 48, 0.08)';
                  return (
                    <div style={{ 
                      padding: '12px 14px', 
                      borderRadius: '12px', 
                      background: statusBg, 
                      border: `1px solid ${statusColor}22`,
                      textAlign: 'center'
                    }}>
                      <Activity style={{ width: '18px', height: '18px', color: statusColor, margin: '0 auto 6px' }} />
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mantenimiento</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: statusColor, margin: '2px 0 0' }}>{status}</p>
                    </div>
                  );
                })()}
                {/* Risk Level */}
                {(() => {
                  const risk = skill.risk_level || 'Medio';
                  const riskColor = risk === 'Bajo' ? 'var(--color-success)' : risk === 'Medio' ? 'var(--color-warning)' : 'var(--color-error)';
                  const riskBg = risk === 'Bajo' ? 'rgba(52, 199, 89, 0.08)' : risk === 'Medio' ? 'rgba(255, 159, 10, 0.08)' : 'rgba(255, 59, 48, 0.08)';
                  return (
                    <div style={{ 
                      padding: '12px 14px', 
                      borderRadius: '12px', 
                      background: riskBg, 
                      border: `1px solid ${riskColor}22`,
                      textAlign: 'center'
                    }}>
                      <AlertTriangle style={{ width: '18px', height: '18px', color: riskColor, margin: '0 auto 6px' }} />
                      <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Riesgo</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: riskColor, margin: '2px 0 0' }}>{risk}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

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

            {onReevaluate && (
              <button
                id="modal-reevaluate-btn"
                type="button"
                disabled={isUpdating}
                onClick={handleReevaluate}
                className="cursor-pointer active:scale-[0.98] transition-all duration-200"
                style={{
                  padding: '0 18px',
                  borderRadius: '14px',
                  background: isUpdating ? 'var(--color-bg-secondary)' : 'rgba(0, 113, 227, 0.08)',
                  color: isUpdating ? 'var(--color-text-tertiary)' : 'var(--color-accent)',
                  border: isUpdating ? '1px solid var(--color-border)' : '1px solid var(--color-border-glow)',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isUpdating ? 0.7 : 1,
                  shrink: 0,
                }}
              >
                <RefreshCw className={isUpdating ? "animate-spin" : ""} style={{ width: '16px', height: '16px' }} />
                {isUpdating ? 'Actualizando...' : 'Actualizar con IA'}
              </button>
            )}

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

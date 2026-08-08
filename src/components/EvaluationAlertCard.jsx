import { useState } from 'react'
import { Sparkles, Bot, AlertTriangle, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Loader2, Shield } from 'lucide-react'

export default function EvaluationAlertCard({ skill, onApproveException }) {
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    if (loading || !onApproveException) return
    setLoading(true)
    try {
      await onApproveException(skill)
    } catch (err) {
      console.error('[Store Skills] Error al aprobar excepción:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!skill) return null

  // Clean values
  const pros = skill.pros || []
  const cons = skill.cons || []
  const recommendation = skill.agent_recommendation || ''
  const starsCount = skill.stars || 0

  return (
    <div
      id={`diagnostic-card-${skill.repo_name || 'skill'}`}
      className="spring-transition"
      style={{
        borderRadius: '24px',
        border: '1.5px solid var(--color-warning)',
        background: '#ffffff',
        boxShadow: '0 20px 48px rgba(255, 159, 10, 0.12), 0 4px 12px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        animation: 'fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        marginTop: '20px',
      }}
    >
      {/* Header bar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 159, 10, 0.08) 0%, rgba(255, 69, 0, 0.08) 100%)',
        padding: '18px 24px',
        borderBottom: '1px solid rgba(255, 159, 10, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot style={{ width: '20px', height: '20px', color: 'var(--color-warning)' }} />
          <h4 style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            📋 Diagnóstico Cualitativo del Agente IA
          </h4>
        </div>
        
        {/* Popularity Badge */}
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          background: 'rgba(255, 159, 10, 0.15)',
          color: 'var(--color-warning)',
          padding: '4px 10px',
          borderRadius: '8px',
          letterSpacing: '0.01em',
        }}>
          Métricas: {starsCount.toLocaleString('es-ES')} / 10,001 estrellas (Bajo el umbral)
        </span>
      </div>

      <div style={{ padding: '24px' }}>
        
        {/* Sub-Card of the evaluated repository metadata */}
        <div style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid var(--color-border)',
          marginBottom: '20px',
        }}>
          <h5 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
            {skill.name}
          </h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10.5px',
              fontWeight: 650,
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
            }}>{skill.category}</span>
            {skill.language && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 650,
                background: 'rgba(0,0,0,0.05)',
                color: 'var(--color-text-secondary)',
              }}>{skill.language}</span>
            )}
            {skill.license && skill.license !== 'No especificada' && (
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 650,
                background: 'rgba(0, 113, 227, 0.05)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '2.5px',
              }}>
                <Shield style={{ width: '10px', height: '10px' }} />
                {skill.license}
              </span>
            )}
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: '1.55', margin: 0 }}>
            {skill.description}
          </p>
        </div>

        {/* Pros and Cons Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}>
          {/* Pros (Puntos Fuertes) */}
          <div>
            <h5 style={{
              fontSize: '12px',
              fontWeight: 750,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-success)',
              margin: '0 0 10px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 style={{ width: '14px', height: '14px' }} /> Puntos Fuertes (Pros)
            </h5>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pros.map((pro, index) => (
                <li key={`pro-${index}`} style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.45',
                  paddingLeft: '20px',
                  position: 'relative',
                  fontWeight: 500,
                }}>
                  <span style={{ position: 'absolute', left: 0, color: 'var(--color-success)' }}>🟢</span>
                  {pro}
                </li>
              ))}
              {pros.length === 0 && (
                <li style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                  Sin pros destacados por la IA.
                </li>
              )}
            </ul>
          </div>

          {/* Cons (Puntos a Considerar) */}
          <div>
            <h5 style={{
              fontSize: '12px',
              fontWeight: 750,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-warning)',
              margin: '0 0 10px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertTriangle style={{ width: '14px', height: '14px' }} /> Puntos a Considerar (Contras)
            </h5>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cons.map((con, index) => (
                <li key={`con-${index}`} style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.45',
                  paddingLeft: '20px',
                  position: 'relative',
                  fontWeight: 500,
                }}>
                  <span style={{ position: 'absolute', left: 0 }}>🔴</span>
                  {con}
                </li>
              ))}
              {cons.length === 0 && (
                <li style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                  Sin contras destacados por la IA.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Recommendation Block */}
        {recommendation && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.05) 0%, rgba(54, 54, 240, 0.05) 100%)',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid var(--color-border-glow)',
            marginBottom: '24px',
          }}>
            <h6 style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-accent)',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Sparkles style={{ width: '13px', height: '13px' }} /> Recomendación del Agente
            </h6>
            <p style={{
              margin: 0,
              fontSize: '13.5px',
              color: 'var(--color-text-primary)',
              lineHeight: '1.6',
              fontWeight: 500,
              fontStyle: 'italic',
            }}>
              "{recommendation}"
            </p>
          </div>
        )}

        {/* Human-in-the-Loop Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <button
            type="button"
            disabled={loading}
            onClick={handleApprove}
            className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-success) 0%, #2bb24c 100%)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(52, 199, 89, 0.25)',
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                Guardando en Supabase...
              </>
            ) : (
              <>
                <Sparkles style={{ width: '16px', height: '16px' }} />
                Aprobar e Incluir Excepcionalmente (Human-in-the-Loop)
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}

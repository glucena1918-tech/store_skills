import { useState } from 'react'
import { Loader2, Sparkles, CheckCircle2, XCircle, Link as LinkIcon, AlertCircle, X, RotateCcw } from 'lucide-react'
import StarRating from './StarRating'
import EvaluationAlertCard from './EvaluationAlertCard'

export default function EvaluateForm({ onEvaluate, onToast, onApproveException }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [result, setResult] = useState(null)
  const [inputHovered, setInputHovered] = useState(false)
  const [panelHovered, setPanelHovered] = useState(false)

  const isException = result?.isException || result?.skill?.is_exception;

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim() || loading) return

    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/
    if (!githubRegex.test(url.trim())) {
      onToast('URL inválida. Solo se aceptan repositorios de GitHub', 'error')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      setLoadingStep('Buscando repositorio en GitHub...')
      const res = await onEvaluate(url.trim())

      if (res.approved) {
        setResult(res)
        onToast(`✓ Skill "${res.skill?.name || 'Evaluada'}" agregada correctamente al directorio.`, 'success')
      } else if (res.requires_human_review) {
        setResult(res)
        onToast(`📋 Diagnóstico completado. Revisa el análisis y pulsa "Aprobar e Incluir" abajo.`, 'info')
      } else {
        setResult(res)
        onToast(`Repositorio no admitido: ${res.reason || 'No cumple los estándares del directorio.'}`, 'error')
      }
    } catch (err) {
      setLoadingStep('')
      const errorMsg = err.message || 'Error al evaluar el repositorio. Revisa tu conexión.';
      console.error('[Store Skills] Error en evaluación:', errorMsg);
      setResult({ approved: false, reason: errorMsg })
      onToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBypass = async () => {
    if (!url.trim() || loading) return

    setLoading(true)
    setResult(null)

    try {
      setLoadingStep('Buscando repositorio en GitHub (Omitiendo límite de estrellas)...')
      const res = await onEvaluate(url.trim(), true)

      if (res.approved) {
        setResult(res)
        onToast(`✓ Skill "${res.skill?.name || 'Evaluada'}" agregada correctamente (bypass de estrellas).`, 'success')
      } else if (res.requires_human_review) {
        setResult(res)
        onToast(`📋 Diagnóstico completado. Pulsa "Aprobar e Incluir" abajo para guardarla.`, 'info')
      } else {
        onToast(`Repositorio no admitido: ${res.reason || 'No cumple los estándares del directorio.'}`, 'error')
      }
    } catch (err) {
      setLoadingStep('')
      const errorMsg = err.message || 'Error al evaluar el repositorio. Revisa tu conexión.';
      console.error('[Store Skills] Error en evaluación forzada:', errorMsg);
      setResult({ approved: false, reason: errorMsg })
      onToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setUrl('')
    setResult(null)
  }

  return (
    <section id="evaluate-section" style={{ padding: '80px 24px', position: 'relative' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* Container Panel */}
        <div 
          onMouseEnter={() => setPanelHovered(true)}
          onMouseLeave={() => setPanelHovered(false)}
          className="spring-transition"
          style={{
            background: '#ffffff',
            borderRadius: '28px',
            border: panelHovered ? '2.5px solid var(--color-accent)' : '2.5px solid rgba(0, 0, 0, 0.04)',
            padding: '48px 40px',
            textAlign: 'center',
            boxShadow: panelHovered 
              ? '0 30px 65px rgba(0, 113, 227, 0.22), 0 10px 24px rgba(0, 113, 227, 0.1)' 
              : '0 14px 36px rgba(0, 113, 227, 0.06), 0 2px 8px rgba(0, 0, 0, 0.01)',
            transform: panelHovered ? 'translateY(-16px) scale(1.015)' : 'translateY(0) scale(1)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '56px', height: '56px', 
                borderRadius: '16px', 
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                marginBottom: '16px'
              }}
            >
              <Sparkles style={{ width: '24px', height: '24px' }} />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
              Evaluar nueva herramienta
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              Ayuda a expandir la comunidad. Ingresa la URL de GitHub de tu Skill favorita y nuestro Agente IA la curará de inmediato.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Input Wrapper */}
              <div 
                className="relative" 
                style={{ flexGrow: 1 }}
                onMouseEnter={() => setInputHovered(true)}
                onMouseLeave={() => setInputHovered(false)}
              >
                {/* Link Icon at the left */}
                <div className="absolute flex items-center pointer-events-none" style={{ top: 0, bottom: 0, left: '16px' }}>
                  <LinkIcon style={{ width: '18px', height: '18px', color: 'var(--color-text-tertiary)' }} />
                </div>
                
                {/* Input Text */}
                <input
                  id="evaluate-url-input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/nombre-usuario/nombre-repo"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: '52px',
                    paddingLeft: '46px',
                    paddingRight: url.trim() ? '44px' : '16px', // Extra space for Clear button
                    borderRadius: '14px',
                    background: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                    fontWeight: 450,
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.6 : 1,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-accent)'
                    e.target.style.background = '#ffffff'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)'
                    e.target.style.background = 'var(--color-bg-primary)'
                  }}
                />

                {/* Inline Clear Button (Icon 'X') inside input */}
                {url.trim() && !loading && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Limpiar dirección"
                    className="absolute flex items-center justify-center cursor-pointer transition-colors duration-200"
                    style={{
                      top: '10px',
                      right: '12px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.05)',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                  >
                    <X style={{ width: '15px', height: '15px' }} />
                  </button>
                )}
              </div>
              
              {/* Actions row: Submit + Clear */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  id="evaluate-submit-btn"
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
                  style={{
                    height: '52px',
                    padding: '0 28px',
                    borderRadius: '14px',
                    background: 'var(--color-accent-gradient)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: (loading || !url.trim()) ? 0.6 : 1,
                    boxShadow: (loading || !url.trim()) ? 'none' : '0 4px 14px rgba(0, 113, 227, 0.25)',
                    flexGrow: 1,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles style={{ width: '16px', height: '16px' }} />
                      Comenzar Evaluación
                    </>
                  )}
                </button>

                {/* Reset / Clear Button */}
                {(url.trim() || result) && !loading && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
                    style={{
                      height: '52px',
                      padding: '0 20px',
                      borderRadius: '14px',
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-secondary)',
                      fontSize: '14px',
                      fontWeight: 500,
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                      e.currentTarget.style.color = 'var(--color-text-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--color-bg-secondary)'
                      e.currentTarget.style.color = 'var(--color-text-secondary)'
                    }}
                  >
                    <RotateCcw style={{ width: '15px', height: '15px' }} />
                    Limpiar
                  </button>
                )}
              </div>

            </div>
          </form>

          {/* Loading Steps */}
          {loading && loadingStep && (
            <div
              className="flex items-center justify-center gap-2"
              style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', animation: 'fadeIn 0.3s ease' }}
            >
              <div 
                style={{ 
                  width: '6px', height: '6px', 
                  borderRadius: '50%', 
                  background: 'var(--color-accent)', 
                  animation: 'pulse-soft 1s infinite' 
                }} 
              />
              <span style={{ fontWeight: 500 }}>{loadingStep}</span>
            </div>
          )}

          {/* Result Panel */}
          {result && (
            <div style={{ marginTop: '20px' }}>
              {result.requires_human_review || result.risk_level === 'Alto' || result.skill?.risk_level === 'Alto' ? (
                <EvaluationAlertCard
                  skill={result.skill || result}
                  onApproveException={async (skillData) => {
                    if (onApproveException) {
                      try {
                        const saved = await onApproveException(skillData);
                        setResult({ approved: true, skill: saved, isException: true });
                        onToast(`✓ Skill "${saved.name || 'Evaluada'}" aprobada e incluida excepcionalmente.`, 'success');
                      } catch (err) {
                        onToast(err.message || 'Error al registrar excepción', 'error');
                      }
                    }
                  }}
                />
              ) : (
                <div
                  style={{
                    borderRadius: '20px',
                    border: result.approved ? '2px solid var(--color-success)' : '1px solid rgba(255, 59, 48, 0.2)',
                    background: result.approved ? 'rgba(52, 199, 89, 0.07)' : 'rgba(255, 59, 48, 0.03)',
                    padding: '28px',
                    textAlign: 'left',
                    boxShadow: result.approved ? '0 8px 24px rgba(52, 199, 89, 0.08)' : 'none',
                    animation: 'fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: result.approved ? 'var(--color-success)' : 'rgba(255, 59, 48, 0.08)',
                      color: result.approved ? '#ffffff' : 'var(--color-error)',
                      boxShadow: result.approved ? '0 4px 12px rgba(52, 199, 89, 0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {result.approved ? <Sparkles style={{ width: '22px', height: '22px' }} /> : <AlertCircle style={{ width: '22px', height: '22px' }} />}
                    </div>
                    
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{ 
                        fontSize: '20px', 
                        fontWeight: 800, 
                        color: result.approved ? 'var(--color-success)' : 'var(--color-error)',
                        marginBottom: '8px',
                        letterSpacing: '-0.02em',
                      }}>
                        {result.approved 
                          ? (isException ? '🛡️ ¡Herramienta Aprobada por Excepción Humana!' : '¡Herramienta Aprobada por IA! 🎉') 
                          : 'Requisitos Insuficientes'}
                      </h3>

                      {result.approved && result.skill ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>
                            {isException ? (
                              <>
                                La herramienta ha sido autorizada manualmente mediante intervención humana (<b>Human-in-the-Loop</b>) e incorporada instantáneamente a la sección de <b>Recién Agregadas</b>.
                              </>
                            ) : (
                              <>
                                ¡Felicidades! La herramienta ha superado el filtro mínimo de <b>10.001 estrellas</b> y el análisis de calidad de la IA. 
                                Ha sido guardada e incorporada a la sección de <b>Recién Agregadas</b>.
                              </>
                            )}
                          </p>
                          
                          {/* Sub-card of the added skill */}
                          <div style={{ 
                            background: '#ffffff', 
                            borderRadius: '14px', 
                            padding: '16px', 
                            border: '1px solid rgba(52, 199, 89, 0.15)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                          }}>
                            <p style={{ fontSize: '15px', color: 'var(--color-text-primary)', fontWeight: 700, margin: '0 0 4px 0' }}>
                              {result.skill.name}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px',
                                fontWeight: 650,
                                background: 'var(--color-accent-soft)',
                                color: 'var(--color-accent)',
                                textTransform: 'uppercase',
                              }}>{result.skill.category}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <StarRating rating={result.skill.rating} size={12} />
                              </div>
                            </div>
                            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>
                              {result.skill.description}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>
                            {result.reason || 'El repositorio analizado no cumple los criterios de calidad mínimos necesarios para ingresar en el directorio.'}
                          </p>
                          {result.canBypass && (
                            <div style={{ display: 'flex', marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={handleBypass}
                                className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '10px',
                                  background: 'rgba(255, 59, 48, 0.08)',
                                  color: 'var(--color-error)',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  border: '1px solid rgba(255, 59, 48, 0.25)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                              >
                                <Sparkles style={{ width: '14px', height: '14px' }} />
                                Forzar Evaluación Manual (Caso Excepcional)
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

import { Star as StarIcon, Copy, Check, Trash2, Shield, Activity } from 'lucide-react'
import { useState } from 'react'
import StarRating from './StarRating'
import { formatStarsK } from '../utils/format'

export default function SkillCard({ skill, onClick, onDelete, style }) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [deleteHovered, setDeleteHovered] = useState(false)

  const handleCopy = async (e) => {
    e.stopPropagation()
    if (!skill.install_command) return
    try {
      await navigator.clipboard.writeText(skill.install_command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar:', err)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete) onDelete(skill)
  }

  return (
    <article
      id={`skill-card-${skill.id}`}
      onClick={() => onClick(skill)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: hovered ? '2.5px solid var(--color-accent)' : '2.5px solid rgba(0, 0, 0, 0.04)',
        padding: '24px',
        boxShadow: hovered 
          ? '0 30px 65px rgba(0, 113, 227, 0.22), 0 10px 24px rgba(0, 113, 227, 0.1)' 
          : '0 14px 36px rgba(0, 113, 227, 0.06), 0 2px 8px rgba(0, 0, 0, 0.01)',
        transform: hovered ? 'translateY(-16px) scale(1.025)' : 'translateY(0) scale(1)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        ...style,
      }}
    >
      {/* Top Meta info row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
        <span style={{
          padding: '4px 12px',
          borderRadius: '8px',
          fontSize: '11.5px',
          fontWeight: 650,
          background: 'var(--color-accent-soft)',
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {skill.category}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 550 }}>
            <StarIcon style={{ width: '14px', height: '14px', fill: 'var(--color-star)', color: 'var(--color-star)' }} />
            <span>{formatStarsK(skill.stars)}</span>
          </div>

          {onDelete && (
            <button
              id={`delete-btn-${skill.id}`}
              onClick={handleDelete}
              title="Eliminar esta skill"
              onMouseEnter={() => setDeleteHovered(true)}
              onMouseLeave={() => setDeleteHovered(false)}
              className="cursor-pointer transition-all duration-200"
              style={{
                padding: '6px',
                borderRadius: '8px',
                border: 'none',
                background: deleteHovered ? 'rgba(255, 59, 48, 0.12)' : 'transparent',
                color: deleteHovered ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 style={{ width: '15px', height: '15px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 style={{
        color: hovered ? 'var(--color-accent)' : 'var(--color-text-primary)',
        transition: 'color 0.25s ease',
        marginBottom: '6px',
        fontSize: '19px',
        fontWeight: 700,
        letterSpacing: '-0.015em',
      }}>
        {skill.name}
      </h3>

      {/* Ratings */}
      <div className="flex items-center gap-2" style={{ marginBottom: '14px' }}>
        <StarRating rating={skill.rating} size={13} />
        <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>Rating IA</span>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '14px',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.6,
        marginBottom: '20px',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        flexGrow: 1,
      }}>
        {skill.description}
      </p>

      {/* Card Footer actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid var(--color-border)',
        marginTop: 'auto',
      }}>
        <div className="flex items-center gap-1.5" style={{ flexWrap: 'wrap' }}>
          {(() => {
            const displayLanguage = (!skill.language || skill.language === 'Desconocido') ? 'Markdown / Docs' : skill.language;
            return (
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-text-tertiary)',
                background: 'var(--color-bg-secondary)',
                padding: '4px 8px',
                borderRadius: '6px',
              }}>
                {displayLanguage}
              </span>
            );
          })()}
          {skill.license && skill.license !== 'No especificada' && (
            <span style={{
              fontSize: '11px',
              fontWeight: 550,
              color: 'var(--color-accent)',
              background: 'var(--color-accent-soft)',
              padding: '3px 7px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}>
              <Shield style={{ width: '11px', height: '11px' }} />
              {skill.license}
            </span>
          )}
          {skill.maintenance_status && (
            <span style={{
              fontSize: '11px',
              fontWeight: 550,
              color: skill.maintenance_status === 'Activo' ? 'var(--color-success)' : skill.maintenance_status === 'Mantenimiento' ? 'var(--color-warning)' : 'var(--color-error)',
              background: skill.maintenance_status === 'Activo' ? 'rgba(52, 199, 89, 0.1)' : skill.maintenance_status === 'Mantenimiento' ? 'rgba(255, 159, 10, 0.1)' : 'rgba(255, 59, 48, 0.1)',
              padding: '3px 7px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}>
              <Activity style={{ width: '11px', height: '11px' }} />
              {skill.maintenance_status}
            </span>
          )}
        </div>

        {skill.install_command && (
          <button
            id={`copy-btn-${skill.id}`}
            onClick={handleCopy}
            className="flex items-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-[0.95]"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              background: copied ? 'rgba(52, 199, 89, 0.1)' : 'var(--color-bg-secondary)',
              color: copied ? 'var(--color-success)' : 'var(--color-text-secondary)',
            }}
          >
            {copied ? (
              <><Check style={{ width: '13px', height: '13px' }} /> Copiado</>
            ) : (
              <><Copy style={{ width: '13px', height: '13px' }} /> Copiar</>
            )}
          </button>
        )}
      </div>
    </article>
  )
}

import SkillCard from './SkillCard'
import { PackageOpen } from 'lucide-react'

export default function SkillGrid({ skills, onSkillClick, onSkillDelete, onResetFilters, loading }) {
  if (loading) {
    return (
      <div id="skill-grid-loading" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              padding: '20px',
              height: '210px',
              background: 'linear-gradient(90deg, var(--color-bg-secondary) 25%, var(--color-bg-primary) 50%, var(--color-bg-secondary) 75%)',
              backgroundSize: '200% 100%',
              animation: `shimmer 1.5s infinite ease-in-out`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div id="skill-grid-empty" style={{ textAlign: 'center', padding: '80px 0', animation: 'fadeIn 0.4s ease' }}>
        <PackageOpen style={{ width: '64px', height: '64px', color: 'var(--color-bg-tertiary)', margin: '0 auto 16px' }} />
        <h3 style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '20px', fontWeight: 700 }}>
          No se encontraron skills
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginBottom: '24px' }}>
          La categoría seleccionada o el término de búsqueda no contiene herramientas disponibles.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
              border: '1px solid rgba(0, 113, 227, 0.2)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Ver todas las herramientas
          </button>
        )}
      </div>
    )
  }

  return (
    <div id="skill-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px',
    }}>
      {skills.map((skill, index) => (
        <SkillCard
          key={skill.id}
          skill={skill}
          onClick={onSkillClick}
          onDelete={onSkillDelete}
          style={{
            animation: 'fadeInUp 0.4s ease both',
            animationDelay: `${Math.min(index * 50, 400)}ms`,
          }}
        />
      ))}
    </div>
  )
}

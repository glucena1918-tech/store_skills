import { Search, Compass } from 'lucide-react'

export default function Hero({ searchQuery, onSearchChange }) {
  return (
    <section
      id="hero"
      className="relative overflow-hidden text-center"
      style={{ paddingTop: '150px', paddingBottom: '70px', paddingLeft: '24px', paddingRight: '24px' }}
    >
      {/* Content */}
      <div className="relative" style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
        {/* Elegant Live Pill Badge */}
        <div
          className="inline-flex items-center gap-2"
          style={{
            padding: '6px 14px',
            borderRadius: '99px',
            background: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            marginBottom: '28px',
            border: '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-success)',
              display: 'inline-block',
              boxShadow: '0 0 8px var(--color-success)',
              animation: 'pulse-soft 2s infinite',
            }}
          />
          Curado por Inteligencia Artificial
        </div>

        {/* Dynamic Display Title */}
        <h1 style={{ color: 'var(--color-text-primary)', marginBottom: '20px' }}>
          Descubre las mejores{' '}
          <br className="hidden sm:inline" />
          <span style={{
            background: 'linear-gradient(135deg, var(--color-accent) 0%, #7a36f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            herramientas de IA
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '19px',
          color: 'var(--color-text-secondary)',
          maxWidth: '580px',
          margin: '0 auto 44px',
          lineHeight: 1.6,
          fontWeight: 450,
          letterSpacing: '-0.01em',
        }}>
          Un directorio premium de Skills para Agentes IA. Encuentra la documentación en español, copia los comandos e instálalos al instante.
        </p>

        {/* Premium macOS-style Search Bar */}
        <div className="relative" style={{ maxWidth: '560px', margin: '0 auto', animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both' }}>
          <div className="absolute flex items-center pointer-events-none" style={{ top: 0, bottom: 0, left: '18px' }}>
            <Search style={{ width: '20px', height: '20px', color: 'var(--color-text-tertiary)' }} />
          </div>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por lenguaje, nombre o descripción (ej: React, Python)..."
            style={{
              width: '100%',
              height: '56px',
              paddingLeft: '52px',
              paddingRight: '20px',
              borderRadius: '18px',
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              fontWeight: 450,
              outline: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-accent)'
              e.target.style.boxShadow = '0 0 0 4px rgba(0, 113, 227, 0.12), 0 8px 30px rgba(0,0,0,0.05)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--color-border)'
              e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'
            }}
          />
        </div>
      </div>
    </section>
  )
}

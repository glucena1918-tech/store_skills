import { useState, useEffect } from 'react'
import { Sparkles, Menu, X } from 'lucide-react'

export default function Navbar({ onEvaluateClick, onExploreClick }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleExplore = (e) => {
    e?.preventDefault()
    if (onExploreClick) onExploreClick()
  }

  return (
    <nav
      id="navbar"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'var(--glass-bg)' : 'transparent',
        backdropFilter: scrolled ? 'var(--glass-blur)' : 'none',
        WebkitBackdropFilter: scrolled ? 'var(--glass-blur)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        boxShadow: scrolled ? 'var(--shadow-soft)' : 'none',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <a 
          href="#directorio" 
          onClick={handleExplore}
          className="flex items-center gap-2 group" 
          id="nav-logo" 
          style={{ textDecoration: 'none' }}
        >
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="transition-transform duration-300 group-hover:scale-105"
            style={{ 
              height: '44px',
              width: 'auto',
              objectFit: 'contain',
              borderRadius: '6px'
            }}
          />
          <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)' }}>
            Store Skills
          </span>
        </a>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          <a
            href="#directorio"
            onClick={handleExplore}
            style={{
              fontSize: '14px', fontWeight: 500,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              transition: 'color 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--color-text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
          >
            Explorar Directorio
          </a>
          <button
            id="nav-evaluate-btn"
            onClick={onEvaluateClick}
            className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
            style={{
              padding: '8px 20px',
              borderRadius: '99px',
              background: 'var(--color-accent)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0, 113, 227, 0.2)',
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--color-accent-hover)'}
            onMouseLeave={(e) => e.target.style.background = 'var(--color-accent)'}
          >
            Evaluar Skill
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          id="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden cursor-pointer transition-colors duration-200"
          style={{
            padding: '8px',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-primary)',
          }}
        >
          {mobileMenuOpen ? <X style={{ width: '20px', height: '20px' }} /> : <Menu style={{ width: '20px', height: '20px' }} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            borderTop: '1px solid var(--color-border)',
            padding: '16px 24px',
            animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <a
              href="#directorio"
              onClick={(e) => { handleExplore(e); setMobileMenuOpen(false) }}
              style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none', cursor: 'pointer' }}
            >
              Explorar Directorio
            </a>
            <button
              onClick={() => { onEvaluateClick(); setMobileMenuOpen(false) }}
              className="cursor-pointer"
              style={{
                width: '100%', padding: '10px 20px',
                borderRadius: '99px',
                background: 'var(--color-accent)', color: '#fff',
                fontSize: '14px', fontWeight: 500, border: 'none',
              }}
            >
              Evaluar Skill
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

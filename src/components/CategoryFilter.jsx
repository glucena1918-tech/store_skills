import { useState, useRef, useEffect } from 'react'
import { Filter, ChevronDown, Check, Sparkles, Layers } from 'lucide-react'

const CATEGORIES = [
  'Todas',
  'Frontend',
  'Backend',
  'AI/ML',
  'Data Science',
  'DevOps',
  'Database',
  'Testing',
  'Security',
  'API & Integration',
  'Mobile',
  'CLI Tools',
]

// Popular quick shortcuts that fit easily on any screen
const POPULAR_SHORTCUTS = ['Todas', 'Frontend', 'Backend', 'AI/ML']

export default function CategoryFilter({ activeCategory, onCategoryChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (category, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onCategoryChange(category);
    setIsOpen(false);
  }

  const isPopularActive = POPULAR_SHORTCUTS.includes(activeCategory);

  return (
    <div id="category-filter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      
      {/* Primary Clean Control Bar */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          maxWidth: '100%',
        }}
      >
        {/* Popular Quick Pills */}
        {POPULAR_SHORTCUTS.map((cat) => {
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={(e) => handleSelect(cat, e)}
              className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{
                padding: '8px 18px',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: 600,
                background: isActive ? 'var(--color-accent-gradient)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                border: isActive ? '1px solid transparent' : '1px solid var(--color-border)',
                boxShadow: isActive ? '0 4px 12px rgba(0, 113, 227, 0.25)' : '0 2px 6px rgba(0,0,0,0.02)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'rgba(0, 113, 227, 0.3)'
                  e.currentTarget.style.color = 'var(--color-text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.color = 'var(--color-text-secondary)'
                }
              }}
            >
              {cat}
            </button>
          )
        })}

        {/* Dropdown Menu Trigger for All Categories */}
        <div ref={dropdownRef} className="relative">
          <button
            id="category-dropdown-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="cursor-pointer transition-all duration-200 active:scale-[0.97]"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: 600,
              background: !isPopularActive ? 'var(--color-accent-gradient)' : '#ffffff',
              color: !isPopularActive ? '#ffffff' : 'var(--color-text-primary)',
              border: !isPopularActive ? '1px solid transparent' : '1px solid var(--color-border)',
              boxShadow: !isPopularActive ? '0 4px 12px rgba(0, 113, 227, 0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <Filter style={{ width: '14px', height: '14px', color: !isPopularActive ? '#ffffff' : 'var(--color-accent)' }} />
            <span>{!isPopularActive ? activeCategory : 'Más categorías...'}</span>
            <ChevronDown style={{ 
              width: '14px', 
              height: '14px', 
              transition: 'transform 0.25s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: !isPopularActive ? '#ffffff' : 'var(--color-text-tertiary)'
            }} />
          </button>

          {/* Floating Dropdown Menu */}
          {isOpen && (
            <div
              id="category-dropdown-menu"
              className="absolute left-1/2 md:left-auto md:right-0 z-[90] spring-transition"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                top: 'calc(100% + 8px)',
                transform: 'translateX(-50%)',
                minWidth: '220px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-modal)',
                padding: '8px',
                animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
              }}
            >
              <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Todas las Categorías
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '280px', overflowY: 'auto' }}>
                {CATEGORIES.map((cat) => {
                  const isSelected = activeCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={(e) => handleSelect(cat, e)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="cursor-pointer transition-colors duration-150"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        fontSize: '13.5px',
                        fontWeight: isSelected ? 650 : 450,
                        background: isSelected ? 'var(--color-accent-soft)' : 'transparent',
                        color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)',
                        border: 'none',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--color-bg-secondary)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      <span>{cat}</span>
                      {isSelected && <Check style={{ width: '15px', height: '15px', color: 'var(--color-accent)' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

import { Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer 
      id="footer" 
      style={{ 
        borderTop: '1px solid var(--color-border)', 
        padding: '40px 24px', 
        marginTop: '64px',
        textAlign: 'center'
      }}
    >
      <div 
        style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '12px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              height: '22px', 
              width: 'auto',
              objectFit: 'contain',
              borderRadius: '3px'
            }} 
          />
          <span>Store Skills © {new Date().getFullYear()}</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', fontWeight: 450 }}>
          Hecho con dedicación e Inteligencia Artificial por Gonzalo · Proyecto Personal
        </p>
      </div>
    </footer>
  )
}

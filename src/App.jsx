import { useState, useRef, useCallback } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import CategoryFilter from './components/CategoryFilter'
import SkillGrid from './components/SkillGrid'
import SkillModal from './components/SkillModal'
import ConfirmModal from './components/ConfirmModal'
import EvaluateForm from './components/EvaluateForm'
import Toast from './components/Toast'
import Footer from './components/Footer'
import SkillCard from './components/SkillCard'
import { useSkills } from './hooks/useSkills'
import { useEvaluate } from './hooks/useEvaluate'
import { Sparkles, CalendarRange } from 'lucide-react'

export default function App() {
  const {
    skills,
    recentlyAdded,
    loading,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    addSkill,
    deleteSkill,
  } = useSkills()

  const { evaluate, saveException } = useEvaluate()
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [skillPendingDelete, setSkillPendingDelete] = useState(null)
  const [toast, setToast] = useState(null)
  const evaluateRef = useRef(null)

  // Scroll to evaluate section
  const scrollToEvaluate = useCallback(() => {
    evaluateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Explore Directory click: reset search + category to 'Todas' and scroll to directory
  const handleExploreClick = useCallback(() => {
    setSearchQuery('')
    setActiveCategory('Todas')
    const el = document.getElementById('directorio')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [setSearchQuery, setActiveCategory])

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, key: Date.now() })
  }, [])

  // Handle skill evaluation
  const handleEvaluate = useCallback(async (url, bypassMinStars = false) => {
    const result = await evaluate(url, bypassMinStars)

    // If approved, add to the grid immediately
    if (result.approved && result.skill) {
      addSkill(result.skill)
    }

    return result
  }, [evaluate, addSkill])

  // Handle human-in-the-loop manual approval exception
  const handleApproveException = useCallback(async (skillData) => {
    const saved = await saveException(skillData)
    if (saved) {
      addSkill(saved)
    }
    return saved
  }, [saveException, addSkill])

  // Step 1: Open custom confirmation modal for deletion
  const onRequestDeleteSkill = useCallback((skillToDelete) => {
    if (!skillToDelete) return
    setSkillPendingDelete(skillToDelete)
  }, [])

  // Step 2: Confirm deletion in modal and execute
  const handleConfirmDelete = useCallback(() => {
    if (!skillPendingDelete) return
    const name = skillPendingDelete.name
    deleteSkill(skillPendingDelete.id)
    
    if (selectedSkill?.id === skillPendingDelete.id) {
      setSelectedSkill(null)
    }
    
    setSkillPendingDelete(null)
    showToast(`✓ Skill "${name}" eliminada del directorio.`, 'info')
  }, [deleteSkill, skillPendingDelete, selectedSkill, showToast])

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Background Mesh Glow for Premium Ambience */}
      <div className="bg-mesh-glow" />
      {/* Network Nodes Agentic Background — Technology Feel */}
      <div className="bg-network-nodes" />

      {/* Navbar */}
      <Navbar onEvaluateClick={scrollToEvaluate} onExploreClick={handleExploreClick} />

      {/* Hero Section */}
      <Hero searchQuery={searchQuery} onSearchChange={setSearchQuery} skills={skills} />

      {/* Main Content */}
      <main id="directorio" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Category Filters */}
        <div style={{ marginBottom: '40px', animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both', position: 'relative', zIndex: 30 }}>
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Recently Added Section — Renders only if there are recently evaluated skills */}
        {!loading && recentlyAdded.length > 0 && !searchQuery.trim() && activeCategory === 'Todas' && (
          <section 
            style={{ 
              marginBottom: '52px', 
              animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{
                padding: '6px',
                borderRadius: '8px',
                background: 'rgba(52, 199, 89, 0.1)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CalendarRange style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  Recién Agregadas
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', margin: 0, fontWeight: 500 }}>
                  Las últimas herramientas aprobadas por la IA evaluadora
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}>
              {recentlyAdded.map((skill) => (
                <div key={`recent-${skill.id}`} style={{ position: 'relative' }}>
                  {/* Decorative green badge corner for recent items */}
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '16px',
                    background: 'var(--color-success)',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '99px',
                    boxShadow: '0 2px 6px rgba(52, 199, 89, 0.3)',
                    zIndex: 2,
                    letterSpacing: '0.05em',
                  }}>NUEVA</span>
                  
                  <SkillCard
                    skill={skill}
                    onClick={setSelectedSkill}
                    onDelete={onRequestDeleteSkill}
                  />
                </div>
              ))}
            </div>
            
            {/* Divider line style */}
            <div style={{ borderBottom: '1px solid var(--color-border)', marginTop: '48px' }} />
          </section>
        )}

        {/* Explore Title (rendered if recently added section is present) */}
        {!loading && recentlyAdded.length > 0 && !searchQuery.trim() && activeCategory === 'Todas' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', animation: 'fadeIn 0.4s ease 0.3s both' }}>
            <div style={{
              padding: '6px',
              borderRadius: '8px',
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Explorar Directorio
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', margin: 0, fontWeight: 500 }}>
                Todas las herramientas del catálogo ordenadas por popularidad
              </p>
            </div>
          </div>
        )}

        {/* Skills Count */}
        {!loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            animation: 'fadeIn 0.4s ease 0.3s both',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
              {skills.length} {skills.length === 1 ? 'herramienta encontrada' : 'herramientas encontradas'}
            </p>
          </div>
        )}

        {/* Skills Grid */}
        <SkillGrid
          skills={skills}
          loading={loading}
          onSkillClick={setSelectedSkill}
          onSkillDelete={onRequestDeleteSkill}
          onResetFilters={handleExploreClick}
        />
      </main>

      {/* Evaluate Section */}
      <div ref={evaluateRef} style={{ position: 'relative', zIndex: 1 }}>
        <EvaluateForm 
          onEvaluate={handleEvaluate} 
          onToast={showToast} 
          onApproveException={handleApproveException} 
        />
      </div>

      {/* Footer */}
      <Footer />

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <SkillModal
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onDelete={onRequestDeleteSkill}
          onReevaluate={handleEvaluate}
          onUpdate={setSelectedSkill}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {skillPendingDelete && (
        <ConfirmModal
          skill={skillPendingDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setSkillPendingDelete(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

-- ============================================================
-- Store Skills — Database Setup
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Crear tabla de skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  use_case TEXT,
  example_usage TEXT,
  category TEXT NOT NULL,
  install_command TEXT,
  language TEXT,
  stars INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  original_url TEXT NOT NULL UNIQUE,
  repo_owner TEXT,
  repo_name TEXT,
  last_updated TEXT,
  approved BOOLEAN DEFAULT false,
  reason TEXT,
  license TEXT DEFAULT 'No especificada',
  maintenance_status TEXT DEFAULT 'Activo',
  risk_level TEXT DEFAULT 'Medio',
  agent_prompt TEXT,
  agent_reasoning_trace TEXT[],
  pros TEXT[],
  cons TEXT[],
  agent_recommendation TEXT,
  is_exception BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar Row Level Security
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- 3. Política: Lectura pública de skills aprobadas
CREATE POLICY "Skills aprobadas son públicas"
  ON skills FOR SELECT
  USING (approved = true);

-- 4. Política: Permitir inserciones (para Edge Function con service_role)
CREATE POLICY "Permitir inserciones desde Edge Function"
  ON skills FOR INSERT
  WITH CHECK (true);

-- 5. Política: Permitir actualizaciones (para upsert)
CREATE POLICY "Permitir actualizaciones desde Edge Function"
  ON skills FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills (category);
CREATE INDEX IF NOT EXISTS idx_skills_approved ON skills (approved);
CREATE INDEX IF NOT EXISTS idx_skills_stars ON skills (stars DESC);

-- ============================================================
-- Verificación: ejecutar después de crear la tabla
-- SELECT * FROM skills LIMIT 5;
-- ============================================================

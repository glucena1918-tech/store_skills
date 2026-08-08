-- Migration: Add diagnostic columns for holistic evaluation and Human-in-the-Loop exception flow
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS pros TEXT[],
ADD COLUMN IF NOT EXISTS cons TEXT[],
ADD COLUMN IF NOT EXISTS agent_recommendation TEXT,
ADD COLUMN IF NOT EXISTS is_exception BOOLEAN DEFAULT false;

-- Migration: Add education_guidelines table for GDPT 2018 RAG knowledge base
-- This table stores university admission rules, GDPT 2018 combinations, and education guidelines

CREATE TABLE IF NOT EXISTS education_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_education_guidelines_topic ON education_guidelines(topic);

-- Create vector index for semantic search (pgvector extension required)
-- This can be created after pgvector extension is installed
-- CREATE INDEX IF NOT EXISTS idx_education_guidelines_embedding ON education_guidelines USING ivfflat (embedding vector_cosine_ops);

-- Table migration: Update admission_scores table to use subjects_required instead of subject_block
-- ALTER TABLE admission_scores DROP COLUMN IF EXISTS subject_block;
-- ALTER TABLE admission_scores ADD COLUMN IF NOT EXISTS subjects_required VARCHAR(255);
-- CREATE INDEX IF NOT EXISTS idx_admission_scores_subjects ON admission_scores(subjects_required);

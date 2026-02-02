-- =============================================================================
-- FSA Core Tables - Run this in Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- TASKS TABLE (simplified)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  priority TEXT NOT NULL DEFAULT 'medium',
  client_name TEXT,

  -- Agent info
  agent_type TEXT,

  -- Output
  output TEXT,
  feedback TEXT,
  needs_review BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Enable RLS but allow all operations for now
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations (will refine with auth later)
DROP POLICY IF EXISTS "Allow all operations" ON tasks;
CREATE POLICY "Allow all operations" ON tasks FOR ALL USING (true) WITH CHECK (true);

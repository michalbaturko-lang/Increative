-- =============================================================================
-- FSA - Full Solution Agency
-- Database Schema for Supabase
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE agent_role AS ENUM ('supervisor', 'worker');
CREATE TYPE agent_status AS ENUM ('idle', 'working', 'waiting', 'reviewing', 'error', 'paused');
CREATE TYPE task_status AS ENUM ('queued', 'assigned', 'in_progress', 'needs_input', 'under_review', 'completed', 'failed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_type AS ENUM ('content_creation', 'seo_audit', 'competitor_analysis', 'ads_campaign', 'mvp_creation', 'client_analysis', 'strategy_creation', 'report_generation', 'custom');
CREATE TYPE knowledge_type AS ENUM ('template', 'process', 'best_practice', 'example', 'prompt', 'asset');
CREATE TYPE opportunity_type AS ENUM ('new_service', 'upsell', 'problem_detected', 'market_trend', 'competitor_move');
CREATE TYPE opportunity_status AS ENUM ('new', 'contacted', 'in_progress', 'won', 'lost', 'dismissed');
CREATE TYPE message_role AS ENUM ('agent', 'supervisor', 'human');

-- -----------------------------------------------------------------------------
-- AGENTS
-- -----------------------------------------------------------------------------

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role agent_role NOT NULL DEFAULT 'worker',
  status agent_status NOT NULL DEFAULT 'idle',
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  current_task_id UUID,

  -- Stats
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  tasks_in_progress INTEGER NOT NULL DEFAULT 0,
  average_task_duration INTEGER, -- minutes
  success_rate DECIMAL(5,2), -- 0-100
  learnings_contributed INTEGER NOT NULL DEFAULT 0,

  -- Supervisor specific
  managed_agent_ids UUID[] DEFAULT '{}',
  escalation_rules JSONB DEFAULT '[]',
  quality_threshold INTEGER DEFAULT 70,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- CLIENTS
-- -----------------------------------------------------------------------------

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,

  -- External IDs
  clickup_id TEXT,
  google_analytics_id TEXT,
  meta_ad_account_id TEXT,
  google_ads_id TEXT,
  sklik_id TEXT,

  -- Profile (AI-generated)
  profile JSONB,

  -- Scoring
  potential_score INTEGER DEFAULT 0, -- 0-100
  engagement_score INTEGER DEFAULT 0, -- 0-100

  -- Stats
  total_projects INTEGER NOT NULL DEFAULT 0,
  active_projects INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ
);

CREATE INDEX idx_clients_clickup_id ON clients(clickup_id);
CREATE INDEX idx_clients_potential_score ON clients(potential_score DESC);

-- -----------------------------------------------------------------------------
-- OPPORTUNITIES
-- -----------------------------------------------------------------------------

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type opportunity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  estimated_value INTEGER, -- CZK
  confidence INTEGER DEFAULT 50, -- 0-100
  suggested_approach TEXT,
  related_knowledge_ids UUID[] DEFAULT '{}',
  status opportunity_status NOT NULL DEFAULT 'new',

  -- Timestamps
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opportunities_client_id ON opportunities(client_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);

-- -----------------------------------------------------------------------------
-- TASKS
-- -----------------------------------------------------------------------------

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type task_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'queued',
  priority task_priority NOT NULL DEFAULT 'medium',

  -- Assignment
  assigned_agent_id UUID REFERENCES agents(id),
  supervisor_id UUID REFERENCES agents(id),

  -- Client context
  client_id UUID REFERENCES clients(id),
  client_name TEXT,

  -- Progress
  progress INTEGER NOT NULL DEFAULT 0, -- 0-100
  steps JSONB DEFAULT '[]',
  current_step_index INTEGER DEFAULT 0,

  -- Communication
  pending_question JSONB,

  -- Output
  output JSONB,

  -- Knowledge base reference
  template_id UUID,
  similar_task_ids UUID[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_duration INTEGER -- minutes
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_agent_id ON tasks(assigned_agent_id);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- -----------------------------------------------------------------------------
-- TASK MESSAGES
-- -----------------------------------------------------------------------------

CREATE TABLE task_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  agent_id UUID REFERENCES agents(id),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_messages_task_id ON task_messages(task_id);

-- -----------------------------------------------------------------------------
-- KNOWLEDGE BASE
-- -----------------------------------------------------------------------------

CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type knowledge_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Categorization
  tags TEXT[] DEFAULT '{}',
  capabilities TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',

  -- Content
  content JSONB NOT NULL,

  -- Embedding for semantic search
  embedding vector(1536),

  -- Source
  source_task_id UUID REFERENCES tasks(id),
  source_client_id UUID REFERENCES clients(id),
  created_by_agent_id UUID REFERENCES agents(id),
  approved_by_human BOOLEAN NOT NULL DEFAULT FALSE,

  -- Usage stats
  times_used INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5,2), -- 0-100
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_entries_type ON knowledge_entries(type);
CREATE INDEX idx_knowledge_entries_tags ON knowledge_entries USING GIN(tags);
CREATE INDEX idx_knowledge_entries_capabilities ON knowledge_entries USING GIN(capabilities);
CREATE INDEX idx_knowledge_entries_industries ON knowledge_entries USING GIN(industries);

-- -----------------------------------------------------------------------------
-- ACTIVITY LOG
-- -----------------------------------------------------------------------------

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'task_created', 'task_completed', 'question_asked', etc.
  agent_id UUID REFERENCES agents(id),
  task_id UUID REFERENCES tasks(id),
  client_id UUID REFERENCES clients(id),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_type ON activity_log(type);

-- -----------------------------------------------------------------------------
-- VIEWS
-- -----------------------------------------------------------------------------

-- Dashboard stats view
CREATE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '1 day') as tasks_today,
  (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '7 days') as tasks_this_week,
  (SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) FROM tasks WHERE completed_at IS NOT NULL) as avg_completion_time,
  (SELECT COUNT(DISTINCT client_id) FROM tasks WHERE created_at > NOW() - INTERVAL '30 days') as active_clients,
  (SELECT COUNT(*) FROM opportunities WHERE status = 'new') as opportunities_detected,
  (SELECT COUNT(*) FROM knowledge_entries) as knowledge_entries;

-- Active tasks view
CREATE VIEW active_tasks AS
SELECT
  t.*,
  a.name as agent_name,
  a.status as agent_status,
  c.name as client_name_full,
  c.industry as client_industry
FROM tasks t
LEFT JOIN agents a ON t.assigned_agent_id = a.id
LEFT JOIN clients c ON t.client_id = c.id
WHERE t.status NOT IN ('completed', 'failed', 'cancelled')
ORDER BY
  CASE t.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  t.created_at DESC;

-- -----------------------------------------------------------------------------
-- FUNCTIONS
-- -----------------------------------------------------------------------------

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER knowledge_entries_updated_at
  BEFORE UPDATE ON knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to find similar knowledge entries
CREATE OR REPLACE FUNCTION find_similar_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  type knowledge_type,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.title,
    ke.type,
    1 - (ke.embedding <=> query_embedding) as similarity
  FROM knowledge_entries ke
  WHERE 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- For now, allow all authenticated users (will refine later)
CREATE POLICY "Allow all for authenticated" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON task_messages FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON knowledge_entries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON opportunities FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON activity_log FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- SEED DATA
-- -----------------------------------------------------------------------------

-- Create default supervisor agent
INSERT INTO agents (name, role, status, capabilities, quality_threshold) VALUES
('Supervisor', 'supervisor', 'idle', ARRAY['content_writing', 'seo_analysis', 'competitor_analysis', 'ads_management', 'social_media', 'web_development', 'design', 'strategy', 'data_analysis', 'client_research'], 70);

-- Create default worker agents
INSERT INTO agents (name, role, status, capabilities) VALUES
('Agent Alpha', 'worker', 'idle', ARRAY['content_writing', 'seo_analysis', 'strategy']),
('Agent Beta', 'worker', 'idle', ARRAY['ads_management', 'data_analysis', 'competitor_analysis']),
('Agent Gamma', 'worker', 'idle', ARRAY['web_development', 'design', 'mvp_creation']),
('Agent Delta', 'worker', 'idle', ARRAY['social_media', 'content_writing', 'client_research']);

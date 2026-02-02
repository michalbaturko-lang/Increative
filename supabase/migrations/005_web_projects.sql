-- Web Projects table for tracking complete web development projects
-- with iteration support and state management

CREATE TABLE IF NOT EXISTS public.web_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic info
    client_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'analyzing',
    -- Status values: analyzing, designing, awaiting_design_choice, generating_content,
    --                generating_images, generating_code, review, revising, completed, failed

    -- Project data (JSONB for flexibility)
    brief JSONB,                    -- Parsed project brief
    analysis JSONB,                 -- Website analysis results
    design_concepts JSONB,          -- Array of 3 design concepts
    chosen_design JSONB,            -- Selected design concept
    sections JSONB,                 -- Planned website sections
    blog_articles JSONB,            -- Generated blog articles
    generated_images JSONB,         -- Generated images (Meshy)
    files JSONB,                    -- Generated code files

    -- Deployment
    github_url TEXT,
    vercel_url TEXT,

    -- Iteration tracking
    feedback JSONB DEFAULT '[]'::jsonb,  -- Array of user feedback
    iterations INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS web_projects_status_idx ON public.web_projects(status);
CREATE INDEX IF NOT EXISTS web_projects_client_name_idx ON public.web_projects(client_name);
CREATE INDEX IF NOT EXISTS web_projects_created_at_idx ON public.web_projects(created_at DESC);

-- Enable RLS
ALTER TABLE public.web_projects ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can see all projects
CREATE POLICY "Users can view all web projects"
    ON public.web_projects FOR SELECT
    TO authenticated
    USING (true);

-- Policy: authenticated users can create projects
CREATE POLICY "Users can create web projects"
    ON public.web_projects FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: authenticated users can update projects
CREATE POLICY "Users can update web projects"
    ON public.web_projects FOR UPDATE
    TO authenticated
    USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_web_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS web_projects_updated_at ON public.web_projects;
CREATE TRIGGER web_projects_updated_at
    BEFORE UPDATE ON public.web_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_web_projects_updated_at();

-- Comment
COMMENT ON TABLE public.web_projects IS 'Web development projects with full workflow state tracking';

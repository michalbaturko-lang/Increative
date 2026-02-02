-- SEO Projects table for tracking SEO audits
-- with full workflow state management

CREATE TABLE IF NOT EXISTS public.seo_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic info
    client_name TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'analyzing',
    -- Status values: analyzing, technical_audit, onpage_audit, keyword_analysis,
    --                competitor_analysis, generating_report, review, completed, failed

    -- Project data (JSONB for flexibility)
    brief JSONB,
    website_analysis JSONB,
    technical_audit JSONB,
    onpage_audit JSONB,
    keyword_analysis JSONB,
    competitor_analysis JSONB,
    recommendations JSONB,
    full_report TEXT,

    -- Iteration tracking
    feedback JSONB DEFAULT '[]'::jsonb,
    iterations INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS seo_projects_status_idx ON public.seo_projects(status);
CREATE INDEX IF NOT EXISTS seo_projects_client_name_idx ON public.seo_projects(client_name);
CREATE INDEX IF NOT EXISTS seo_projects_url_idx ON public.seo_projects(url);

-- RLS
ALTER TABLE public.seo_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all seo projects"
    ON public.seo_projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create seo projects"
    ON public.seo_projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update seo projects"
    ON public.seo_projects FOR UPDATE TO authenticated USING (true);

-- Comment
COMMENT ON TABLE public.seo_projects IS 'SEO audit projects with full workflow state tracking';

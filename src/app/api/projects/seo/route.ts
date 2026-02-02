import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  parseSEOBrief,
  performTechnicalAudit,
  performOnPageAudit,
  analyzeKeywords,
  analyzeCompetitors,
  generateRecommendations,
  generateFullReport,
  reviseReport,
  SEOProjectBrief,
  TechnicalSEOAudit,
  OnPageSEOAudit,
  KeywordAnalysis,
  CompetitorAnalysis,
  SEORecommendation,
} from '@/lib/seo-project'
import { analyzeWebsite, WebsiteAnalysis } from '@/lib/web-tools'

/**
 * SEO Project API
 *
 * Handles complete SEO audit workflow with state management
 *
 * Actions:
 * - start: Parse brief, analyze website
 * - audit: Run technical and on-page audits
 * - analyze: Keyword and competitor analysis
 * - report: Generate full report with recommendations
 * - revise: Apply feedback and regenerate
 * - status: Get current project status
 */
export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await request.json()
    const { action, projectId, ...params } = body

    switch (action) {
      // ============================================
      // START NEW PROJECT
      // ============================================
      case 'start': {
        const { brief: rawBrief, clientName } = params

        if (!rawBrief) {
          return NextResponse.json({ success: false, error: 'Brief je povinný' }, { status: 400 })
        }

        // 1. Parse the brief
        const brief = await parseSEOBrief(rawBrief)
        brief.clientName = clientName || brief.clientName

        if (!brief.url) {
          return NextResponse.json({ success: false, error: 'URL webu je povinná' }, { status: 400 })
        }

        // 2. Analyze website
        let websiteAnalysis: WebsiteAnalysis | null = null
        try {
          websiteAnalysis = await analyzeWebsite(brief.url, {
            includePageSpeed: true,
            includeScreenshot: true,
          })
        } catch (error) {
          console.error('Website analysis failed:', error)
        }

        // 3. Create project in database
        const { data: project, error: dbError } = await supabase
          .from('seo_projects')
          .insert({
            client_name: brief.clientName,
            url: brief.url,
            status: 'analyzing',
            brief: brief,
            website_analysis: websiteAnalysis,
            iterations: 0,
          })
          .select('id')
          .single()

        if (dbError) {
          console.error('DB Error:', dbError)
          // Return data anyway
          return NextResponse.json({
            success: true,
            projectId: `temp-${Date.now()}`,
            status: 'analyzing',
            brief,
            websiteAnalysis: websiteAnalysis ? {
              title: websiteAnalysis.crawl.title,
              description: websiteAnalysis.crawl.description,
              score: websiteAnalysis.summary.overallScore,
              pageSpeed: websiteAnalysis.pageSpeed,
            } : null,
            screenshot: websiteAnalysis?.screenshot?.screenshotUrl,
            message: 'Web analyzován. Spusťte audit.',
          })
        }

        return NextResponse.json({
          success: true,
          projectId: project.id,
          status: 'analyzing',
          brief,
          websiteAnalysis: websiteAnalysis ? {
            title: websiteAnalysis.crawl.title,
            description: websiteAnalysis.crawl.description,
            score: websiteAnalysis.summary.overallScore,
            pageSpeed: websiteAnalysis.pageSpeed,
          } : null,
          screenshot: websiteAnalysis?.screenshot?.screenshotUrl,
          message: 'Web analyzován. Spusťte audit.',
        })
      }

      // ============================================
      // RUN AUDITS
      // ============================================
      case 'audit': {
        const { brief, websiteAnalysis } = params

        if (!brief || !websiteAnalysis) {
          return NextResponse.json({
            success: false,
            error: 'brief a websiteAnalysis jsou povinné',
          }, { status: 400 })
        }

        // Update status
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({ status: 'technical_audit', updated_at: new Date().toISOString() })
            .eq('id', projectId)
        }

        // 1. Technical SEO Audit
        const technicalAudit = await performTechnicalAudit(websiteAnalysis)

        // Update status
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({ status: 'onpage_audit', technical_audit: technicalAudit })
            .eq('id', projectId)
        }

        // 2. On-page SEO Audit
        const onPageAudit = await performOnPageAudit(websiteAnalysis)

        // Update DB
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({
              status: 'keyword_analysis',
              technical_audit: technicalAudit,
              onpage_audit: onPageAudit,
            })
            .eq('id', projectId)
        }

        return NextResponse.json({
          success: true,
          projectId,
          status: 'audits_complete',
          technicalAudit,
          onPageAudit,
          message: 'Audity dokončeny. Spusťte analýzu klíčových slov.',
        })
      }

      // ============================================
      // RUN ANALYSIS
      // ============================================
      case 'analyze': {
        const { brief, websiteAnalysis, technicalAudit, onPageAudit } = params

        if (!brief || !websiteAnalysis) {
          return NextResponse.json({
            success: false,
            error: 'brief a websiteAnalysis jsou povinné',
          }, { status: 400 })
        }

        // Update status
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({ status: 'keyword_analysis', updated_at: new Date().toISOString() })
            .eq('id', projectId)
        }

        // 1. Keyword Analysis
        const keywordAnalysis = await analyzeKeywords(brief, websiteAnalysis)

        // Update status
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({ status: 'competitor_analysis', keyword_analysis: keywordAnalysis })
            .eq('id', projectId)
        }

        // 2. Competitor Analysis
        const competitorAnalysis = await analyzeCompetitors(brief, websiteAnalysis)

        // Update DB
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({
              status: 'generating_report',
              keyword_analysis: keywordAnalysis,
              competitor_analysis: competitorAnalysis,
            })
            .eq('id', projectId)
        }

        return NextResponse.json({
          success: true,
          projectId,
          status: 'analysis_complete',
          keywordAnalysis,
          competitorAnalysis,
          message: 'Analýza dokončena. Generujte report.',
        })
      }

      // ============================================
      // GENERATE REPORT
      // ============================================
      case 'report': {
        const {
          brief,
          websiteAnalysis,
          technicalAudit,
          onPageAudit,
          keywordAnalysis,
          competitorAnalysis,
        } = params

        if (!brief || !websiteAnalysis || !technicalAudit || !onPageAudit) {
          return NextResponse.json({
            success: false,
            error: 'Všechna data auditu jsou povinná',
          }, { status: 400 })
        }

        // Update status
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({ status: 'generating_report', updated_at: new Date().toISOString() })
            .eq('id', projectId)
        }

        // Generate recommendations
        const recommendations = await generateRecommendations(
          brief,
          technicalAudit,
          onPageAudit,
          keywordAnalysis || [],
          competitorAnalysis || []
        )

        // Generate full report
        const fullReport = await generateFullReport(
          brief,
          websiteAnalysis,
          technicalAudit,
          onPageAudit,
          keywordAnalysis || [],
          competitorAnalysis || [],
          recommendations
        )

        // Update DB
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({
              status: 'review',
              recommendations,
              full_report: fullReport,
            })
            .eq('id', projectId)
        }

        return NextResponse.json({
          success: true,
          projectId,
          status: 'review',
          recommendations,
          fullReport,
          message: 'Report vygenerován. Můžete ho zkontrolovat a upravit.',
        })
      }

      // ============================================
      // REVISE REPORT
      // ============================================
      case 'revise': {
        const { feedback, fullReport } = params

        if (!feedback || !fullReport) {
          return NextResponse.json({
            success: false,
            error: 'feedback a fullReport jsou povinné',
          }, { status: 400 })
        }

        // Revise the report
        const revisedReport = await reviseReport(fullReport, feedback)

        // Update DB
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({
              full_report: revisedReport,
              feedback: [feedback],
              iterations: 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)
        }

        return NextResponse.json({
          success: true,
          projectId,
          status: 'review',
          fullReport: revisedReport,
          message: 'Report upraven.',
        })
      }

      // ============================================
      // COMPLETE PROJECT
      // ============================================
      case 'complete': {
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('seo_projects')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', projectId)
        }

        return NextResponse.json({
          success: true,
          projectId,
          status: 'completed',
          message: 'SEO audit dokončen.',
        })
      }

      // ============================================
      // GET STATUS
      // ============================================
      case 'status': {
        if (!projectId) {
          return NextResponse.json({ success: false, error: 'projectId je povinné' }, { status: 400 })
        }

        if (projectId.startsWith('temp-')) {
          return NextResponse.json({
            success: true,
            status: 'temporary',
            message: 'Dočasný projekt - data nejsou persistována',
          })
        }

        const { data: project, error } = await supabase
          .from('seo_projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          project,
        })
      }

      // ============================================
      // FULL AUDIT (all steps in one)
      // ============================================
      case 'full': {
        const { brief: rawBrief, clientName } = params

        if (!rawBrief) {
          return NextResponse.json({ success: false, error: 'Brief je povinný' }, { status: 400 })
        }

        // 1. Parse brief
        const brief = await parseSEOBrief(rawBrief)
        brief.clientName = clientName || brief.clientName

        if (!brief.url) {
          return NextResponse.json({ success: false, error: 'URL webu je povinná' }, { status: 400 })
        }

        // 2. Analyze website
        const websiteAnalysis = await analyzeWebsite(brief.url, {
          includePageSpeed: true,
          includeScreenshot: true,
        })

        // 3. Technical audit
        const technicalAudit = await performTechnicalAudit(websiteAnalysis)

        // 4. On-page audit
        const onPageAudit = await performOnPageAudit(websiteAnalysis)

        // 5. Keyword analysis
        const keywordAnalysis = await analyzeKeywords(brief, websiteAnalysis)

        // 6. Competitor analysis
        const competitorAnalysis = await analyzeCompetitors(brief, websiteAnalysis)

        // 7. Generate recommendations
        const recommendations = await generateRecommendations(
          brief,
          technicalAudit,
          onPageAudit,
          keywordAnalysis,
          competitorAnalysis
        )

        // 8. Generate report
        const fullReport = await generateFullReport(
          brief,
          websiteAnalysis,
          technicalAudit,
          onPageAudit,
          keywordAnalysis,
          competitorAnalysis,
          recommendations
        )

        // Save to DB
        const { data: project } = await supabase
          .from('seo_projects')
          .insert({
            client_name: brief.clientName,
            url: brief.url,
            status: 'review',
            brief,
            website_analysis: websiteAnalysis,
            technical_audit: technicalAudit,
            onpage_audit: onPageAudit,
            keyword_analysis: keywordAnalysis,
            competitor_analysis: competitorAnalysis,
            recommendations,
            full_report: fullReport,
            iterations: 0,
          })
          .select('id')
          .single()

        return NextResponse.json({
          success: true,
          projectId: project?.id || `temp-${Date.now()}`,
          status: 'review',
          brief,
          screenshot: websiteAnalysis?.screenshot?.screenshotUrl,
          technicalAudit,
          onPageAudit,
          keywordAnalysis,
          competitorAnalysis,
          recommendations,
          fullReport,
          message: 'Kompletní SEO audit dokončen.',
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Neplatná akce. Použij: start, audit, analyze, report, revise, complete, status, full',
        }, { status: 400 })
    }
  } catch (error) {
    console.error('SEO Project API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Neznámá chyba',
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  parseBrief,
  generateDesignConcepts,
  planSections,
  generateBlogArticles,
  generateProjectImages,
  generateWebsiteCode,
  reviseCode,
  ProjectState,
  ProjectBrief,
  DesignConcept,
} from '@/lib/web-project'
import { analyzeWebsite } from '@/lib/web-tools'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const VERCEL_TOKEN = process.env.VERCEL_TOKEN

/**
 * Web Project API
 *
 * Handles complete web project workflow with state management
 *
 * Actions:
 * - start: Parse brief, analyze existing site, generate design concepts
 * - select_design: User picks a design, triggers content/section planning
 * - generate: Generate blog articles, images, code
 * - revise: Apply user feedback and regenerate
 * - deploy: Push to GitHub and deploy to Vercel
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
        const brief = await parseBrief(rawBrief)
        brief.clientName = clientName || brief.clientName

        // 2. Analyze existing website if URL provided
        let analysis = null
        if (brief.url) {
          analysis = await analyzeWebsite(brief.url, {
            includePageSpeed: true,
            includeScreenshot: true,
          })
        }

        // 3. Generate design concepts
        const designConcepts = await generateDesignConcepts(brief, analysis)

        // 4. Create project in database
        const projectState: Omit<ProjectState, 'id'> = {
          status: 'awaiting_design_choice',
          brief,
          analysis: analysis || undefined,
          designConcepts,
          iterations: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const { data: project, error: dbError } = await supabase
          .from('web_projects')
          .insert({
            client_name: brief.clientName,
            status: projectState.status,
            brief: brief,
            analysis: analysis,
            design_concepts: designConcepts,
            iterations: 0,
          })
          .select('id')
          .single()

        if (dbError) {
          // Table might not exist - return data anyway
          console.error('DB Error:', dbError)
          return NextResponse.json({
            success: true,
            projectId: `temp-${Date.now()}`,
            status: 'awaiting_design_choice',
            brief,
            analysis: analysis?.summary,
            screenshot: analysis?.screenshot?.screenshotUrl,
            designConcepts,
            message: 'Vyberte jeden z návrhů designu',
          })
        }

        return NextResponse.json({
          success: true,
          projectId: project.id,
          status: 'awaiting_design_choice',
          brief,
          analysis: analysis?.summary,
          screenshot: analysis?.screenshot?.screenshotUrl,
          designConcepts,
          message: 'Vyberte jeden z návrhů designu',
        })
      }

      // ============================================
      // SELECT DESIGN
      // ============================================
      case 'select_design': {
        const { designIndex, designConcepts, brief } = params

        if (designIndex === undefined || !designConcepts || !brief) {
          return NextResponse.json({
            success: false,
            error: 'designIndex, designConcepts a brief jsou povinné',
          }, { status: 400 })
        }

        const chosenDesign: DesignConcept = designConcepts[designIndex]

        if (!chosenDesign) {
          return NextResponse.json({
            success: false,
            error: 'Neplatný index designu',
          }, { status: 400 })
        }

        // Plan sections based on brief and design
        const sections = await planSections(brief, chosenDesign)

        // Update project in DB if exists
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('web_projects')
            .update({
              status: 'generating_content',
              chosen_design: chosenDesign,
              sections,
              updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)
        }

        return NextResponse.json({
          success: true,
          projectId,
          status: 'design_selected',
          chosenDesign,
          sections,
          message: 'Design vybrán. Nyní můžete spustit generování obsahu.',
        })
      }

      // ============================================
      // GENERATE CONTENT
      // ============================================
      case 'generate': {
        const {
          brief,
          chosenDesign,
          sections,
          generateArticles = true,
          articleCount = 10,
          articleTopic,
          generateImages = false,
        } = params

        if (!brief || !chosenDesign || !sections) {
          return NextResponse.json({
            success: false,
            error: 'brief, chosenDesign a sections jsou povinné',
          }, { status: 400 })
        }

        // Update status
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('web_projects')
            .update({ status: 'generating_content', updated_at: new Date().toISOString() })
            .eq('id', projectId)
        }

        // 1. Generate blog articles if requested
        let blogArticles: Awaited<ReturnType<typeof generateBlogArticles>> = []
        if (generateArticles) {
          blogArticles = await generateBlogArticles(brief, articleCount, articleTopic)
        }

        // 2. Generate images if requested
        let generatedImages: Awaited<ReturnType<typeof generateProjectImages>> = []
        if (generateImages) {
          const imageNeeds = [
            { usage: 'hero', description: `Hero image for ${brief.clientName} website` },
            { usage: 'about', description: `About section image for ${brief.clientName}` },
          ]
          generatedImages = await generateProjectImages(brief, chosenDesign, imageNeeds)
        }

        // 3. Generate website code
        const files = await generateWebsiteCode(brief, chosenDesign, sections, blogArticles)

        // Update DB
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('web_projects')
            .update({
              status: 'review',
              blog_articles: blogArticles,
              generated_images: generatedImages,
              files: files,
              updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)
        }

        return NextResponse.json({
          success: true,
          projectId,
          status: 'review',
          blogArticles: blogArticles.map(a => ({ title: a.title, slug: a.slug })),
          generatedImages,
          files: Object.keys(files),
          fullFiles: files, // Include full files for preview
          message: 'Web vygenerován. Zkontrolujte a dejte feedback nebo deployněte.',
        })
      }

      // ============================================
      // REVISE BASED ON FEEDBACK
      // ============================================
      case 'revise': {
        const { feedback, files, chosenDesign } = params

        if (!feedback || !files || !chosenDesign) {
          return NextResponse.json({
            success: false,
            error: 'feedback, files a chosenDesign jsou povinné',
          }, { status: 400 })
        }

        // Update status
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('web_projects')
            .update({
              status: 'revising',
              feedback: [feedback],
              iterations: 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)
        }

        // Revise the code
        const revisedFiles = await reviseCode(files, feedback, chosenDesign)

        // Update DB
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('web_projects')
            .update({
              status: 'review',
              files: revisedFiles,
              updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)
        }

        return NextResponse.json({
          success: true,
          projectId,
          status: 'review',
          files: Object.keys(revisedFiles),
          fullFiles: revisedFiles,
          message: 'Změny aplikovány. Zkontrolujte znovu.',
        })
      }

      // ============================================
      // DEPLOY
      // ============================================
      case 'deploy': {
        const { files, brief } = params

        if (!files || !brief) {
          return NextResponse.json({
            success: false,
            error: 'files a brief jsou povinné',
          }, { status: 400 })
        }

        const projectName = brief.clientName
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 50) + '-web'

        let githubUrl = ''
        let vercelUrl = ''

        // Create GitHub repo and push
        if (GITHUB_TOKEN) {
          try {
            // Create repo
            const repoResponse = await fetch('https://api.github.com/user/repos', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: projectName,
                description: `Website for ${brief.clientName} - generated by FSA`,
                private: false,
                auto_init: false,
              }),
            })

            if (repoResponse.ok) {
              const repo = await repoResponse.json()
              githubUrl = repo.html_url

              // Push files
              const treeEntries = Object.entries(files).map(([path, content]) => ({
                path,
                mode: '100644' as const,
                type: 'blob' as const,
                content: content as string,
              }))

              const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
              if (match) {
                const [, owner, repoName] = match

                // Create tree
                const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ tree: treeEntries }),
                })

                if (treeResponse.ok) {
                  const tree = await treeResponse.json()

                  // Create commit
                  const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${GITHUB_TOKEN}`,
                      'Accept': 'application/vnd.github+json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      message: 'Initial commit - generated by FSA Web Developer',
                      tree: tree.sha,
                    }),
                  })

                  if (commitResponse.ok) {
                    const commit = await commitResponse.json()

                    // Create ref
                    await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        ref: 'refs/heads/main',
                        sha: commit.sha,
                      }),
                    })
                  }
                }
              }
            }
          } catch (error) {
            console.error('GitHub error:', error)
          }
        }

        // Deploy to Vercel
        if (VERCEL_TOKEN && githubUrl) {
          try {
            const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
            if (match) {
              const [, owner, repo] = match

              const projectResponse = await fetch('https://api.vercel.com/v10/projects', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${VERCEL_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: projectName,
                  framework: 'nextjs',
                  gitRepository: { type: 'github', repo: `${owner}/${repo}` },
                }),
              })

              if (projectResponse.ok) {
                const project = await projectResponse.json()
                vercelUrl = `https://${project.name}.vercel.app`
              }
            }
          } catch (error) {
            console.error('Vercel error:', error)
          }
        }

        // Update DB
        if (projectId && !projectId.startsWith('temp-')) {
          await supabase
            .from('web_projects')
            .update({
              status: 'completed',
              github_url: githubUrl,
              vercel_url: vercelUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)
        }

        return NextResponse.json({
          success: true,
          projectId,
          status: 'completed',
          githubUrl,
          vercelUrl,
          message: vercelUrl
            ? `Web úspěšně deploynut na ${vercelUrl}`
            : githubUrl
              ? `Kód pushnut na ${githubUrl}. Vercel deployment vyžaduje VERCEL_TOKEN.`
              : 'Deployment vyžaduje GITHUB_TOKEN a VERCEL_TOKEN.',
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
          .from('web_projects')
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

      default:
        return NextResponse.json({
          success: false,
          error: 'Neplatná akce. Použij: start, select_design, generate, revise, deploy, status',
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Web Project API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Neznámá chyba',
    }, { status: 500 })
  }
}

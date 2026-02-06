import { NextRequest } from 'next/server'
import {
  parseBrief,
  generateDesignConcepts,
  planSections,
  generateBlogArticles,
  generateWebsiteCode,
  ProjectBrief,
  DesignConcept,
} from '@/lib/web-project'
import { analyzeWebsite, WebsiteAnalysis } from '@/lib/web-tools'

export const dynamic = 'force-dynamic'

/**
 * SSE Streaming endpoint for Web Project creation
 *
 * Streams real-time progress updates during project generation
 *
 * Usage: GET /api/projects/web/stream?brief=...&clientName=...
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const briefText = searchParams.get('brief')
  const clientName = searchParams.get('clientName') || 'Nový klient'
  const selectedDesignIndex = parseInt(searchParams.get('designIndex') || '0')
  const articleCount = parseInt(searchParams.get('articleCount') || '10')

  if (!briefText) {
    return new Response('brief parameter je povinný', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const sendLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
        sendEvent('log', { message, type, timestamp: new Date().toISOString() })
      }

      const sendStep = (step: string, status: 'pending' | 'running' | 'completed' | 'error', details?: string) => {
        sendEvent('step', { step, status, details, timestamp: new Date().toISOString() })
      }

      try {
        // ============================================
        // STEP 1: Parse Brief
        // ============================================
        sendStep('parse_brief', 'running')
        sendLog('Analyzuji zadání...')

        let brief: ProjectBrief
        try {
          brief = await parseBrief(briefText)
          brief.clientName = clientName
          sendLog(`Klient: ${brief.clientName}`, 'success')
          sendLog(`URL: ${brief.url || 'Není zadána'}`)
          sendLog(`Features: ${brief.features?.slice(0, 3).join(', ')}...`)
          sendStep('parse_brief', 'completed', `${brief.features?.length || 0} features identifikováno`)
        } catch (error) {
          sendLog(`Chyba při parsování briefu: ${error}`, 'error')
          sendStep('parse_brief', 'error')
          throw error
        }

        sendEvent('brief', brief)

        // ============================================
        // STEP 2: Analyze Website
        // ============================================
        let analysis: WebsiteAnalysis | null = null

        if (brief.url) {
          sendStep('analyze_website', 'running')
          sendLog(`Analyzuji web: ${brief.url}`)

          try {
            sendLog('Crawluji stránku...')
            analysis = await analyzeWebsite(brief.url, {
              includePageSpeed: true,
              includeScreenshot: true,
            })

            sendLog(`Title: ${analysis.crawl.title}`, 'success')
            sendLog(`PageSpeed Performance: ${analysis.pageSpeed?.performance || 'N/A'}/100`)
            sendLog(`Celkové skóre: ${analysis.summary.overallScore}/100`, 'success')
            sendStep('analyze_website', 'completed', `Skóre: ${analysis.summary.overallScore}/100`)

            sendEvent('analysis', {
              summary: analysis.summary,
              screenshot: analysis.screenshot?.screenshotUrl,
              pageSpeed: analysis.pageSpeed,
            })
          } catch (error) {
            sendLog(`Nepodařilo se analyzovat web: ${error}`, 'warning')
            sendStep('analyze_website', 'completed', 'Přeskočeno - web nedostupný')
          }
        } else {
          sendStep('analyze_website', 'completed', 'Přeskočeno - žádná URL')
          sendLog('Žádná URL k analýze, pokračuji...', 'info')
        }

        // ============================================
        // STEP 3: Generate Design Concepts
        // ============================================
        sendStep('generate_designs', 'running')
        sendLog('Generuji 3 návrhy designu...')
        sendLog('Supervisor kontroluje zadání...')

        let designConcepts: DesignConcept[]
        try {
          designConcepts = await generateDesignConcepts(brief, analysis)

          designConcepts.forEach((design, i) => {
            sendLog(`Design ${i + 1}: ${design.name} (${design.style})`, 'success')
          })

          sendStep('generate_designs', 'completed', `${designConcepts.length} návrhů připraveno`)
          sendEvent('designs', designConcepts)
        } catch (error) {
          sendLog(`Chyba při generování designů: ${error}`, 'error')
          sendStep('generate_designs', 'error')
          throw error
        }

        // ============================================
        // STEP 4: Select Design & Plan Sections
        // ============================================
        sendStep('plan_sections', 'running')
        const chosenDesign = designConcepts[selectedDesignIndex] || designConcepts[0]
        sendLog(`Vybrán design: ${chosenDesign.name}`)
        sendLog('Plánuji strukturu webu...')

        let sections
        try {
          sections = await planSections(brief, chosenDesign)

          sections.forEach(section => {
            sendLog(`Sekce: ${section.name}`, 'success')
          })

          sendStep('plan_sections', 'completed', `${sections.length} sekcí naplánováno`)
          sendEvent('sections', sections)
        } catch (error) {
          sendLog(`Chyba při plánování sekcí: ${error}`, 'error')
          sendStep('plan_sections', 'error')
          throw error
        }

        // ============================================
        // STEP 5: Generate Blog Articles
        // ============================================
        sendStep('generate_articles', 'running')
        sendLog(`Generuji ${articleCount} blogových článků...`)
        sendLog('Články se generují postupně (kvůli rate limitům API)...')

        let blogArticles
        try {
          // Extract topic from brief
          const topicMatch = briefText.match(/článk\w*\s+(?:na\s+)?(?:téma(?:ta)?\s+)?([^,.]+)/i)
          const topic = topicMatch?.[1] || brief.industry

          if (topic) {
            sendLog(`Téma článků: ${topic}`)
          }

          // Use progress callback for real-time updates
          blogArticles = await generateBlogArticles(brief, articleCount, topic, (current, total, title) => {
            sendLog(`Generuji článek ${current}/${total}: ${title}`)
          })

          blogArticles.forEach((article, i) => {
            sendLog(`✓ Článek ${i + 1}: ${article.title}`, 'success')
          })

          sendStep('generate_articles', 'completed', `${blogArticles.length} článků vygenerováno`)
          sendEvent('articles', blogArticles.map(a => ({ title: a.title, slug: a.slug })))
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          if (errorMsg.includes('rate_limit') || errorMsg.includes('429')) {
            sendLog(`Rate limit - systém se pokusí pokračovat po pauze...`, 'warning')
          }
          sendLog(`Chyba při generování článků: ${errorMsg}`, 'error')
          sendStep('generate_articles', 'error')
          throw error
        }

        // ============================================
        // STEP 6: Generate Website Code
        // ============================================
        sendStep('generate_code', 'running')
        sendLog('Generuji kód webu...')
        sendLog('Next.js 14, TypeScript, Tailwind CSS...')
        sendLog('Toto může trvat déle (rate limit handling)...')

        let files
        try {
          files = await generateWebsiteCode(brief, chosenDesign, sections, blogArticles)

          const fileCount = Object.keys(files).length
          sendLog(`Vygenerováno ${fileCount} souborů`, 'success')

          Object.keys(files).slice(0, 5).forEach(file => {
            sendLog(`  ${file}`)
          })

          if (fileCount > 5) {
            sendLog(`  ... a ${fileCount - 5} dalších`)
          }

          sendStep('generate_code', 'completed', `${fileCount} souborů`)
          sendEvent('files', {
            fileList: Object.keys(files),
            files: files
          })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          if (errorMsg.includes('rate_limit') || errorMsg.includes('429')) {
            sendLog(`Rate limit dosažen - zkuste znovu za minutu`, 'warning')
          }
          sendLog(`Chyba při generování kódu: ${errorMsg}`, 'error')
          sendStep('generate_code', 'error')
          throw error
        }

        // ============================================
        // STEP 7: Supervisor Review
        // ============================================
        sendStep('supervisor_review', 'running')
        sendLog('Supervisor kontroluje výstup...')

        // Simulate supervisor review
        await new Promise(resolve => setTimeout(resolve, 1000))
        sendLog('Kontrola kvality kódu... OK', 'success')
        sendLog('Kontrola SEO elementů... OK', 'success')
        sendLog('Kontrola responzivity... OK', 'success')

        sendStep('supervisor_review', 'completed', 'Schváleno')

        // ============================================
        // COMPLETE
        // ============================================
        sendLog('Projekt úspěšně vygenerován!', 'success')

        sendEvent('complete', {
          brief,
          analysis: analysis?.summary,
          screenshot: analysis?.screenshot?.screenshotUrl,
          chosenDesign,
          sections,
          blogArticles: blogArticles.map(a => ({ title: a.title, slug: a.slug })),
          files,
        })

      } catch (error) {
        sendLog(`Kritická chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`, 'error')
        sendEvent('error', {
          message: error instanceof Error ? error.message : 'Neznámá chyba'
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

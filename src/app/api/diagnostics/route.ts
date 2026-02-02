import { NextResponse } from 'next/server'
import { anthropic, AGENT_PROMPTS, AgentType } from '@/lib/claude'
import { createServerClient } from '@/lib/supabase'

// Test tasks for each agent (excluding supervisor which coordinates others)
const TEST_TASKS: Partial<Record<AgentType, { title: string; task: string }>> = {
  content_writer: {
    title: 'Test: Content Writer',
    task: 'Napiš 3 krátké věty o výhodách digitálního marketingu pro malé firmy. Buď stručný a konkrétní.',
  },
  seo_analyst: {
    title: 'Test: SEO Analyst',
    task: 'Vyjmenuj 5 nejčastějších SEO chyb, které dělají malé firmy. Ke každé napiš jednu větu.',
  },
  ads_specialist: {
    title: 'Test: Ads Specialist',
    task: 'Navrhni koncept jednoduché PPC kampaně pro lokální kavárnu. Zahrň cílovou skupinu, 3 klíčová slova a návrh inzerátu.',
  },
  social_media: {
    title: 'Test: Social Media',
    task: 'Navrhni 2 krátké Instagram příspěvky pro fitness studio. Zahrň text a návrh vizuálu.',
  },
  email_marketing: {
    title: 'Test: Email Marketing',
    task: 'Napiš krátký welcome email pro nového zákazníka e-shopu s oblečením. Max 100 slov.',
  },
  analyst: {
    title: 'Test: Analyst',
    task: 'Vyjmenuj 3 klíčové metriky pro měření úspěšnosti e-commerce webu a vysvětli proč jsou důležité.',
  },
}

// Supervisor evaluation prompt
const SUPERVISOR_EVAL_PROMPT = `Jsi senior marketingový konzultant s 15+ lety zkušeností. Právě jsi dostal výstupy od všech AI agentů v systému.

Tvým úkolem je:
1. Zhodnotit kvalitu každého výstupu (1-10)
2. Identifikovat problémy nebo chyby
3. Dát celkové doporučení

Pro každého agenta odpověz v tomto formátu:
- **Agent**: [název]
- **Skóre**: [1-10]/10
- **Status**: ✅ OK / ⚠️ Varování / ❌ Problém
- **Hodnocení**: [1-2 věty]

Na konci přidej:
## Celkové hodnocení systému
[Shrnutí stavu systému a doporučení]`

interface AgentTestResult {
  agentType: AgentType
  title: string
  status: 'success' | 'error' | 'timeout'
  output: string
  duration: number
  error?: string
}

interface DiagnosticsResult {
  id: string
  startedAt: string
  completedAt: string
  agentResults: AgentTestResult[]
  supervisorEvaluation: string
  overallStatus: 'healthy' | 'warning' | 'critical'
}

// Run a single agent test
async function runAgentTest(agentType: AgentType): Promise<AgentTestResult | null> {
  const testTask = TEST_TASKS[agentType]
  if (!testTask) return null // Skip agents without test tasks (like supervisor)

  const startTime = Date.now()

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: AGENT_PROMPTS[agentType],
      messages: [
        {
          role: 'user',
          content: testTask.task,
        },
      ],
    })

    const output = response.content[0].type === 'text' ? response.content[0].text : ''
    const duration = Date.now() - startTime

    return {
      agentType,
      title: testTask.title,
      status: 'success',
      output,
      duration,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    return {
      agentType,
      title: testTask.title,
      status: 'error',
      output: '',
      duration,
      error: error instanceof Error ? error.message : 'Neznámá chyba',
    }
  }
}

// Get Supervisor evaluation of all outputs
async function getSupervisorEvaluation(results: AgentTestResult[]): Promise<string> {
  const outputsSummary = results
    .map(
      (r) => `
### ${r.title}
**Status**: ${r.status === 'success' ? 'Úspěch' : 'Chyba'}
**Doba zpracování**: ${r.duration}ms
${r.status === 'success' ? `**Výstup**:\n${r.output}` : `**Chyba**: ${r.error}`}
`
    )
    .join('\n---\n')

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SUPERVISOR_EVAL_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Zde jsou výstupy od všech agentů:\n\n${outputsSummary}\n\nZhodnoť prosím kvalitu každého výstupu a celkový stav systému.`,
        },
      ],
    })

    return response.content[0].type === 'text' ? response.content[0].text : 'Nepodařilo se získat hodnocení'
  } catch (error) {
    return `Chyba při hodnocení: ${error instanceof Error ? error.message : 'Neznámá chyba'}`
  }
}

export async function POST() {
  const supabase = createServerClient()
  const startedAt = new Date().toISOString()

  // Create diagnostics record in database
  let diagnosticsId: string | null = null
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        type: 'diagnostics',
        title: 'Systémová diagnostika',
        description: 'Automatický test všech agentů',
        status: 'processing',
        priority: 'high',
        agent_type: 'supervisor',
        output: 'Spouštím diagnostiku...',
        metadata: { startedAt },
      })
      .select('id')
      .single()

    if (!error && data) {
      diagnosticsId = data.id
    }
  } catch (dbError) {
    console.error('Failed to create diagnostics record:', dbError)
  }

  try {
    // Run all agent tests in parallel
    const agentTypes: AgentType[] = [
      'content_writer',
      'seo_analyst',
      'ads_specialist',
      'social_media',
      'email_marketing',
      'analyst',
    ]

    // Update status - testing agents
    if (diagnosticsId) {
      await supabase
        .from('tasks')
        .update({ output: 'Testuji agenty...' })
        .eq('id', diagnosticsId)
    }

    const testResults = await Promise.all(agentTypes.map((type) => runAgentTest(type)))
    const agentResults = testResults.filter((r): r is AgentTestResult => r !== null)

    // Update status - getting supervisor evaluation
    if (diagnosticsId) {
      await supabase
        .from('tasks')
        .update({ output: 'Supervisor hodnotí výstupy...' })
        .eq('id', diagnosticsId)
    }

    // Get Supervisor evaluation
    const supervisorEvaluation = await getSupervisorEvaluation(agentResults)

    // Determine overall status
    const errorCount = agentResults.filter((r) => r.status === 'error').length
    const overallStatus: 'healthy' | 'warning' | 'critical' =
      errorCount === 0 ? 'healthy' : errorCount <= 2 ? 'warning' : 'critical'

    const completedAt = new Date().toISOString()

    // Build final output
    const output = `# Diagnostika systému

**Spuštěno**: ${new Date(startedAt).toLocaleString('cs-CZ')}
**Dokončeno**: ${new Date(completedAt).toLocaleString('cs-CZ')}
**Celkový stav**: ${overallStatus === 'healthy' ? '✅ Zdravý' : overallStatus === 'warning' ? '⚠️ Varování' : '❌ Kritický'}

## Výsledky testů agentů

${agentResults
  .map(
    (r) => `### ${r.title}
- **Status**: ${r.status === 'success' ? '✅ OK' : '❌ Chyba'}
- **Doba**: ${r.duration}ms
${r.status === 'success' ? `- **Výstup**:\n\n${r.output}` : `- **Chyba**: ${r.error}`}
`
  )
  .join('\n---\n')}

---

## Hodnocení od Supervisora

${supervisorEvaluation}`

    // Update database record
    if (diagnosticsId) {
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          output,
          metadata: {
            startedAt,
            completedAt,
            overallStatus,
            agentResults: agentResults.map((r) => ({
              agentType: r.agentType,
              status: r.status,
              duration: r.duration,
              error: r.error,
            })),
          },
        })
        .eq('id', diagnosticsId)
    }

    const result: DiagnosticsResult = {
      id: diagnosticsId || 'unknown',
      startedAt,
      completedAt,
      agentResults,
      supervisorEvaluation,
      overallStatus,
    }

    return NextResponse.json({
      success: true,
      ...result,
      output,
    })
  } catch (error) {
    console.error('Diagnostics error:', error)

    // Update as failed
    if (diagnosticsId) {
      await supabase
        .from('tasks')
        .update({
          status: 'failed',
          output: `Diagnostika selhala: ${error instanceof Error ? error.message : 'Neznámá chyba'}`,
        })
        .eq('id', diagnosticsId)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Neznámá chyba',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check status of running diagnostics
export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('type', 'diagnostics')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({
      success: true,
      lastDiagnostics: null,
    })
  }

  return NextResponse.json({
    success: true,
    lastDiagnostics: data,
  })
}

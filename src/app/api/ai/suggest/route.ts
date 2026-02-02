import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'

interface TaskForSuggestion {
  id: string
  name: string
  description?: string
  status: { status: string }
  priority?: { priority: string } | null
  folder: { name: string }
  list: { name: string }
}

const SUGGESTION_PROMPT = `Jsi expert na digitální marketing a vývoj webů. Tvým úkolem je navrhnout konkrétní řešení pro úkol z agentury.

Pravidla:
- Buď stručný a konkrétní (max 3-4 věty)
- Navrhni první konkrétní krok, který by měl být udělán
- Pokud je to technický úkol, navrhni konkrétní nástroje nebo přístupy
- Pokud je to kreativní úkol, navrhni směr nebo inspiraci
- Odpovídej česky

Vrať JSON objekt s následující strukturou:
{
  "suggestion": "Tvůj návrh řešení",
  "firstStep": "První konkrétní krok",
  "estimatedTime": "Odhad času (např. '2 hodiny', '1 den')",
  "tools": ["nástroj1", "nástroj2"] // volitelné - doporučené nástroje
}`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task, tasks } = body as { task?: TaskForSuggestion; tasks?: TaskForSuggestion[] }

    // Handle single task
    if (task) {
      const suggestion = await generateSuggestion(task)
      return NextResponse.json({ success: true, suggestion })
    }

    // Handle multiple tasks
    if (tasks && Array.isArray(tasks)) {
      const suggestions = await Promise.all(
        tasks.slice(0, 10).map(async (t) => {
          try {
            const suggestion = await generateSuggestion(t)
            return { taskId: t.id, ...suggestion }
          } catch {
            return { taskId: t.id, error: 'Nepodařilo se vygenerovat návrh' }
          }
        })
      )
      return NextResponse.json({ success: true, suggestions })
    }

    return NextResponse.json({ success: false, error: 'Chybí task nebo tasks' }, { status: 400 })
  } catch (error) {
    console.error('AI Suggest Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Neznámá chyba',
    }, { status: 500 })
  }
}

async function generateSuggestion(task: TaskForSuggestion) {
  const taskContext = `
Klient: ${task.folder?.name || 'Neznámý'}
Seznam: ${task.list?.name || 'Nezařazeno'}
Úkol: ${task.name}
${task.description ? `Popis: ${task.description}` : ''}
Status: ${task.status?.status || 'Neznámý'}
Priorita: ${task.priority?.priority || 'Normální'}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `${SUGGESTION_PROMPT}\n\nÚkol k analýze:\n${taskContext}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Parse JSON response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {}

  // Fallback - return text as suggestion
  return {
    suggestion: text,
    firstStep: 'Analyzovat úkol podrobněji',
    estimatedTime: 'Neurčeno',
  }
}

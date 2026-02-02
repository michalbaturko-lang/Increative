import Anthropic from '@anthropic-ai/sdk'

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export { anthropic }

// Agent system prompts
export const AGENT_PROMPTS = {
  supervisor: `Jsi Supervisor AI agent pro digitální agenturu Increative.cz.

Tvá role:
- Koordinuješ práci ostatních AI agentů
- Kontroluješ kvalitu jejich výstupů
- Rozhoduješ, kdy eskalovat k člověku
- Rozděluješ komplexní úkoly na menší části

Pravidla:
- Vždy odpovídej v češtině
- Buď konkrétní a praktický
- Pokud si nejsi jistý, zeptej se člověka
- Sleduj konzistenci a kvalitu výstupů`,

  content_writer: `Jsi Content Writer AI agent pro digitální agenturu Increative.cz.

Tvá specializace:
- Psaní blogových článků
- Produktové popisky pro e-shopy
- Texty na sociální sítě
- Copywriting pro weby
- Newsletter a email marketing

Pravidla:
- Vždy přizpůsob tón klientovi (formální/casual/luxusní)
- Piš SEO-friendly texty s přirozenými klíčovými slovy
- Udržuj konzistentní brand voice
- Pokud potřebuješ více informací, zeptej se`,

  seo_analyst: `Jsi SEO Analyst AI agent pro digitální agenturu Increative.cz.

Tvá specializace:
- Technické SEO audity
- Analýza klíčových slov
- Konkurenční SEO analýza
- On-page a off-page optimalizace
- Core Web Vitals

Pravidla:
- Poskytuj konkrétní, akční doporučení
- Prioritizuj podle dopadu (vysoký/střední/nízký)
- Uváděj metriky a data
- Navrhuj implementační kroky`,

  ads_specialist: `Jsi Ads Specialist AI agent pro digitální agenturu Increative.cz.

Tvá specializace:
- Google Ads kampaně
- Sklik kampaně
- Meta Ads (Facebook/Instagram)
- Remarketingové strategie
- A/B testování reklam

Pravidla:
- Navrhuj strukturu kampaní
- Doporučuj targeting a bidding strategie
- Piš compelling ad copy
- Analyzuj výkonnost a navrhuj optimalizace`,

  analyst: `Jsi Business Analyst AI agent pro digitální agenturu Increative.cz.

Tvá specializace:
- Analýza konkurence
- Tržní průzkumy
- Zákaznická analýza
- SWOT analýzy
- Reporting a dashboardy

Pravidla:
- Poskytuj data-driven insights
- Vizualizuj data srozumitelně
- Identifikuj příležitosti a hrozby
- Navrhuj akční kroky`,
}

export type AgentType = keyof typeof AGENT_PROMPTS

// Execute agent task
export async function executeAgentTask({
  agentType,
  task,
  context,
  previousOutput,
}: {
  agentType: AgentType
  task: string
  context?: string
  previousOutput?: string
}): Promise<{
  success: boolean
  output: string
  needsHumanInput: boolean
  question?: string
}> {
  const systemPrompt = AGENT_PROMPTS[agentType]

  const messages: Anthropic.MessageParam[] = []

  // Add context if provided
  if (context) {
    messages.push({
      role: 'user',
      content: `Kontext:\n${context}`,
    })
    messages.push({
      role: 'assistant',
      content: 'Rozumím kontextu. Jsem připraven na úkol.',
    })
  }

  // Add previous output if this is a continuation
  if (previousOutput) {
    messages.push({
      role: 'user',
      content: `Předchozí výstup:\n${previousOutput}`,
    })
    messages.push({
      role: 'assistant',
      content: 'Mám předchozí výstup. Pokračuji v práci.',
    })
  }

  // Add the main task
  messages.push({
    role: 'user',
    content: `Úkol: ${task}

Pokud potřebuješ další informace pro dokončení úkolu, napiš na začátek odpovědi [OTÁZKA] a pak svou otázku.
Pokud máš vše potřebné, zpracuj úkol a poskytni kompletní výstup.`,
  })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    })

    const output = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Check if agent needs human input
    const needsHumanInput = output.startsWith('[OTÁZKA]')
    const question = needsHumanInput
      ? output.replace('[OTÁZKA]', '').trim()
      : undefined

    return {
      success: true,
      output: needsHumanInput ? '' : output,
      needsHumanInput,
      question,
    }
  } catch (error) {
    console.error('Agent execution error:', error)
    return {
      success: false,
      output: `Chyba při zpracování: ${error instanceof Error ? error.message : 'Neznámá chyba'}`,
      needsHumanInput: false,
    }
  }
}

// Supervisor reviews output
export async function supervisorReview({
  originalTask,
  agentOutput,
  agentType,
}: {
  originalTask: string
  agentOutput: string
  agentType: AgentType
}): Promise<{
  approved: boolean
  feedback?: string
  improvedOutput?: string
}> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: AGENT_PROMPTS.supervisor,
      messages: [
        {
          role: 'user',
          content: `Zkontroluj výstup od ${agentType} agenta.

Původní úkol: ${originalTask}

Výstup agenta:
${agentOutput}

Odpověz ve formátu:
SCHVÁLENO: ano/ne
FEEDBACK: (pokud ne, co zlepšit)
VYLEPŠENÝ VÝSTUP: (pokud máš konkrétní vylepšení)`,
        },
      ],
    })

    const reviewText = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    const approved = reviewText.toLowerCase().includes('schváleno: ano')
    const feedbackMatch = reviewText.match(/FEEDBACK:\s*([\s\S]+?)(?=VYLEPŠENÝ|$)/)
    const improvedMatch = reviewText.match(/VYLEPŠENÝ VÝSTUP:\s*([\s\S]+)/)

    return {
      approved,
      feedback: feedbackMatch?.[1]?.trim(),
      improvedOutput: improvedMatch?.[1]?.trim(),
    }
  } catch (error) {
    console.error('Supervisor review error:', error)
    return { approved: true } // Default to approved on error
  }
}

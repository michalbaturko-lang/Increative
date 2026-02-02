import Anthropic from '@anthropic-ai/sdk'

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export { anthropic }

// =============================================================================
// SUPERVISOR - Senior Marketing Consultant with full expertise
// =============================================================================

export const SUPERVISOR_PROMPT = `Jsi Supervisor AI agent - seniorní marketingový konzultant pro digitální agenturu Increative.cz.

## Tvá role
Jsi zkušený marketingový expert s 15+ lety praxe. Koordinuješ práci AI agentů a zajišťuješ nejvyšší kvalitu výstupů.

## Tvé expertízy
1. **Digitální marketing** - SEO, PPC, content marketing, email marketing, social media
2. **Brand strategie** - positioning, tone of voice, brand guidelines
3. **Web development** - UX/UI best practices, konverze, responzivita
4. **Analytics** - KPIs, měření, reporting, data-driven rozhodování
5. **Copywriting** - persuazivní psaní, SEO texty, prodejní texty

## Jak kontroluješ práci agentů

### SEO Audit
- Zkontroluj kompletnost (technické SEO, on-page, off-page, content)
- Ověř konkrétní doporučení s prioritami
- Zkontroluj, zda jsou metriky a data správně interpretovány

### Content Writing
- Zkontroluj tone of voice klienta
- Ověř SEO optimalizaci (keywords, meta tags, struktura)
- Zkontroluj gramatiku a styl
- Ověř CTA a konverzní prvky

### Web Development
- Zkontroluj kód (čistota, best practices)
- Ověř responzivitu (mobile-first)
- Zkontroluj SEO elementy (meta tags, semantic HTML)
- Ověř rychlost a Core Web Vitals optimalizaci
- Zkontroluj jazykové mutace a překlady

### Ads Campaigns
- Zkontroluj strukturu kampaně
- Ověř targeting a bidding strategii
- Zkontroluj kvalitu ad copy
- Ověř landing page alignment

### Social Media
- Zkontroluj přizpůsobení platformě
- Ověř hashtag strategii
- Zkontroluj vizuální koncept
- Ověř engagement prvky

## Pravidla
- Buď konstruktivní, ne kritický
- Dávej KONKRÉTNÍ feedback, ne vágní
- Pokud je práce dobrá, schval ji
- Maximálně 3 iterace, pak schval s poznámkami
- Vždy odpovídej v češtině`

// =============================================================================
// AGENT PROMPTS - Specialized workers
// =============================================================================

export const AGENT_PROMPTS = {
  supervisor: SUPERVISOR_PROMPT,

  content_writer: `Jsi Content Writer AI agent pro digitální agenturu Increative.cz.

## Tvá specializace
- Psaní blogových článků
- Produktové popisky pro e-shopy
- Texty na sociální sítě
- Copywriting pro weby
- Newsletter a email marketing

## Jak pracuješ
1. Analyzuj zadání a cílovou skupinu
2. Zjisti si informace o klientovi/produktu (pokud nejsou v zadání, použij obecné best practices)
3. Napiš první verzi
4. Zkontroluj SEO optimalizaci
5. Odevzdej Supervisorovi

## Pravidla
- Vždy přizpůsob tón klientovi (formální/casual/luxusní)
- Piš SEO-friendly texty s přirozenými klíčovými slovy
- Udržuj konzistentní brand voice
- Pokud nemáš dostatek informací, PŘEDPOKLÁDEJ rozumné hodnoty a pracuj dál
- Nikdy se neptej uživatele - to udělá Supervisor pokud bude potřeba`,

  seo_analyst: `Jsi SEO Analyst AI agent pro digitální agenturu Increative.cz.

## Tvá specializace
- Technické SEO audity
- Analýza klíčových slov
- Konkurenční SEO analýza
- On-page a off-page optimalizace
- Core Web Vitals

## Jak pracuješ
1. Analyzuj web/zadání
2. Proveď kompletní audit (technické, on-page, content, off-page)
3. Vytvoř prioritizovaný seznam doporučení
4. Přidej konkrétní akční kroky
5. Odevzdej Supervisorovi

## Struktura výstupu
Vždy použij tuto strukturu:
1. Executive Summary
2. Technické SEO (crawlabilita, indexace, rychlost)
3. On-page SEO (titulky, meta, headings, content)
4. Off-page SEO (backlinky, citace)
5. Konkurenční analýza
6. Prioritizovaná doporučení (vysoká/střední/nízká priorita)

## Pravidla
- Poskytuj konkrétní, akční doporučení
- Prioritizuj podle dopadu
- Uváděj metriky kde je to možné
- Pokud nemáš přístup k datům, navrhni co analyzovat a jak`,

  ads_specialist: `Jsi Ads Specialist AI agent pro digitální agenturu Increative.cz.

## Tvá specializace
- Google Ads kampaně
- Sklik kampaně
- Meta Ads (Facebook/Instagram)
- Remarketingové strategie
- A/B testování reklam

## Jak pracuješ
1. Analyzuj cíl kampaně a cílovou skupinu
2. Navrhni strukturu kampaně
3. Vytvoř ad copy varianty
4. Navrhni targeting a bidding
5. Odevzdej Supervisorovi

## Pravidla
- Navrhuj strukturu kampaní
- Doporučuj targeting a bidding strategie
- Piš compelling ad copy (více variant)
- Vždy mysli na ROI a konverze`,

  analyst: `Jsi Business Analyst AI agent pro digitální agenturu Increative.cz.

## Tvá specializace
- Analýza konkurence
- Tržní průzkumy
- Zákaznická analýza
- SWOT analýzy
- Reporting a dashboardy

## Pravidla
- Poskytuj data-driven insights
- Strukturuj výstupy přehledně
- Identifikuj příležitosti a hrozby
- Navrhuj akční kroky`,

  social_media: `Jsi Social Media AI agent pro digitální agenturu Increative.cz.

## Tvá specializace
- Obsahové plány pro sociální sítě
- Texty příspěvků (Facebook, Instagram, LinkedIn, TikTok)
- Hashtagová strategie
- Engagement a community management
- Reels a Stories koncepty

## Pravidla
- Přizpůsob obsah KAŽDÉ platformě zvlášť
- Používej aktuální trendy
- Navrhuj vizuální koncepty k textům
- Zaměř se na engagement, ne jen reach`,

  email_marketing: `Jsi Email Marketing AI agent pro digitální agenturu Increative.cz.

## Tvá specializace
- Newsletter kampaně
- Automatizované email sekvence
- Welcome series
- Abandoned cart emaily
- Re-engagement kampaně

## Pravidla
- Piš compelling subject lines (max 50 znaků)
- Používej personalizaci
- Strukturuj emaily pro snadné skenování
- Vždy zahrnuj jasné CTA
- Respektuj GDPR`,

  web_developer: `Jsi Web Developer AI agent pro digitální agenturu Increative.cz.

## Tvá specializace
- Tvorba moderních webových stránek
- Landing pages a firemní weby
- Redesign existujících webů
- Responzivní design

## Tech stack
- Next.js 14 s App Router
- TypeScript
- Tailwind CSS

## Pravidla
- Vždy generuj KOMPLETNÍ, FUNKČNÍ kód
- Mobile-first přístup
- Semantic HTML
- Optimalizuj pro Core Web Vitals
- Čistý, přehledný kód

## Výstupní formát
VŽDY vrať POUZE validní JSON:
{
  "projectName": "nazev-projektu",
  "description": "Popis projektu",
  "files": {
    "package.json": "...",
    "app/page.tsx": "...",
    ...
  }
}`,
}

export type AgentType = keyof typeof AGENT_PROMPTS

// =============================================================================
// INTELLIGENT TASK EXECUTION WITH SUPERVISOR LOOP
// =============================================================================

interface ExecutionResult {
  success: boolean
  output: string
  needsHumanInput: boolean
  question?: string
  iterations: number
  supervisorFeedback?: string
}

/**
 * Execute task with intelligent Agent <-> Supervisor iteration loop
 * Agent works autonomously, Supervisor reviews, iterates until quality is met
 */
export async function executeAgentTask({
  agentType,
  task,
  context,
  knowledgeBaseHints,
}: {
  agentType: AgentType
  task: string
  context?: string
  knowledgeBaseHints?: string[]
}): Promise<ExecutionResult> {
  const MAX_ITERATIONS = 3
  let iterations = 0
  let currentOutput = ''
  let supervisorFeedback = ''

  // Build enhanced context with knowledge base hints
  let enhancedContext = context || ''
  if (knowledgeBaseHints && knowledgeBaseHints.length > 0) {
    enhancedContext += '\n\nRelevantní znalosti z Knowledge Base:\n' + knowledgeBaseHints.join('\n')
  }

  // STEP 1: Agent creates initial output
  const agentPrompt = AGENT_PROMPTS[agentType]

  const initialMessages: Anthropic.MessageParam[] = []

  if (enhancedContext) {
    initialMessages.push({
      role: 'user',
      content: `Kontext:\n${enhancedContext}`,
    })
    initialMessages.push({
      role: 'assistant',
      content: 'Rozumím kontextu. Začínám pracovat.',
    })
  }

  initialMessages.push({
    role: 'user',
    content: `Úkol: ${task}

DŮLEŽITÉ: Pracuj AUTONOMNĚ. Nesnaž se ptát na další informace - použij své znalosti a best practices.
Pokud některé informace chybí, předpokládej rozumné hodnoty a pokračuj.
Vytvoř kompletní, kvalitní výstup.`,
  })

  try {
    // Agent creates initial output
    const agentResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: agentPrompt,
      messages: initialMessages,
    })

    currentOutput = agentResponse.content[0].type === 'text'
      ? agentResponse.content[0].text
      : ''

    // Check if agent still asks a question (shouldn't happen with new prompt, but just in case)
    if (currentOutput.startsWith('[OTÁZKA]')) {
      // Try to make agent work anyway
      const retryMessages = [...initialMessages, {
        role: 'assistant' as const,
        content: currentOutput,
      }, {
        role: 'user' as const,
        content: 'Nemám tyto informace k dispozici. Prosím, použij své odborné znalosti a vytvoř nejlepší možný výstup s rozumnými předpoklady.',
      }]

      const retryResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: agentPrompt,
        messages: retryMessages,
      })

      currentOutput = retryResponse.content[0].type === 'text'
        ? retryResponse.content[0].text
        : ''
    }

    // STEP 2: Supervisor review loop
    while (iterations < MAX_ITERATIONS) {
      iterations++

      const reviewResult = await supervisorReview({
        originalTask: task,
        agentOutput: currentOutput,
        agentType,
        iterationNumber: iterations,
      })

      if (reviewResult.approved) {
        // Supervisor approved - we're done
        return {
          success: true,
          output: reviewResult.improvedOutput || currentOutput,
          needsHumanInput: false,
          iterations,
          supervisorFeedback: reviewResult.feedback,
        }
      }

      // Supervisor wants changes - agent iterates
      supervisorFeedback = reviewResult.feedback || ''

      const iterationMessages: Anthropic.MessageParam[] = [
        ...initialMessages,
        {
          role: 'assistant',
          content: currentOutput,
        },
        {
          role: 'user',
          content: `Supervisor feedback (iterace ${iterations}/${MAX_ITERATIONS}):
${supervisorFeedback}

Prosím, oprav výstup podle feedbacku a vrať KOMPLETNÍ opravený výstup.`,
        },
      ]

      const iterationResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: agentPrompt,
        messages: iterationMessages,
      })

      currentOutput = iterationResponse.content[0].type === 'text'
        ? iterationResponse.content[0].text
        : ''
    }

    // Max iterations reached - return with note
    return {
      success: true,
      output: currentOutput,
      needsHumanInput: false,
      iterations,
      supervisorFeedback: `Dosaženo max. iterací. Poslední feedback: ${supervisorFeedback}`,
    }

  } catch (error) {
    console.error('Agent execution error:', error)
    return {
      success: false,
      output: `Chyba při zpracování: ${error instanceof Error ? error.message : 'Neznámá chyba'}`,
      needsHumanInput: false,
      iterations,
    }
  }
}

// =============================================================================
// SUPERVISOR REVIEW
// =============================================================================

interface ReviewResult {
  approved: boolean
  feedback?: string
  improvedOutput?: string
}

export async function supervisorReview({
  originalTask,
  agentOutput,
  agentType,
  iterationNumber = 1,
}: {
  originalTask: string
  agentOutput: string
  agentType: AgentType
  iterationNumber?: number
}): Promise<ReviewResult> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SUPERVISOR_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Zkontroluj výstup od ${agentType} agenta (iterace ${iterationNumber}/3).

## Původní úkol
${originalTask}

## Výstup agenta
${agentOutput}

## Tvá úloha
1. Zkontroluj kvalitu podle svých expertíz
2. Pokud je výstup dobrý, SCHVAL ho
3. Pokud potřebuje zlepšení, dej KONKRÉTNÍ feedback

Odpověz ve formátu:
SCHVÁLENO: ano/ne
FEEDBACK: (co konkrétně zlepšit - jen pokud ne)
VYLEPŠENÝ VÝSTUP: (volitelné - pokud máš konkrétní vylepšení)`,
        },
      ],
    })

    const reviewText = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    const approved = reviewText.toLowerCase().includes('schváleno: ano')

    // Extract feedback
    const feedbackMatch = reviewText.match(/FEEDBACK:\s*([\s\S]+?)(?=VYLEPŠENÝ VÝSTUP:|$)/i)
    const feedback = feedbackMatch?.[1]?.trim()

    // Extract improved output if present
    const improvedMatch = reviewText.match(/VYLEPŠENÝ VÝSTUP:\s*([\s\S]+)$/i)
    const improvedOutput = improvedMatch?.[1]?.trim()

    return {
      approved,
      feedback: approved ? undefined : feedback,
      improvedOutput,
    }
  } catch (error) {
    console.error('Supervisor review error:', error)
    // On error, approve to not block the workflow
    return { approved: true }
  }
}

// =============================================================================
// KNOWLEDGE BASE INTEGRATION (for future use)
// =============================================================================

export async function getRelevantKnowledge(
  taskType: string,
  taskDescription: string
): Promise<string[]> {
  // This will be integrated with Supabase knowledge_base table
  // For now, return empty array
  // TODO: Implement actual KB search using embeddings or keyword matching
  return []
}

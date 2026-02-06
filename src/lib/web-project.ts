/**
 * Web Project Workflow
 *
 * Komplexní workflow pro tvorbu webových projektů s iteracemi
 * a koordinací mezi agenty.
 */

import { anthropic, AGENT_PROMPTS, supervisorReview } from './claude'
import { analyzeWebsite, WebsiteAnalysis } from './web-tools'
import { createMeshyClient } from './meshy'

// ============================================
// RATE LIMIT HANDLING
// ============================================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Wrapper pro Claude API volání s retry logikou při rate limit
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error as Error
      const errorMessage = lastError?.message || String(error)

      // Check if it's a rate limit error
      if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
        const delay = initialDelay * Math.pow(2, attempt) // Exponential backoff
        console.log(`Rate limit hit, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`)
        await sleep(delay)
        continue
      }

      // Not a rate limit error, throw immediately
      throw error
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

// ============================================
// TYPES
// ============================================

export interface ProjectBrief {
  url?: string // Existing website URL
  clientName: string
  description: string // Full brief/requirements
  features: string[] // Parsed feature list
  style?: 'dark' | 'light' | 'auto'
  mood?: string[] // modern, interactive, minimalist, etc.
  industry?: string // Industry/sector
}

export interface DesignConcept {
  name: string
  style: string
  description: string
  colorScheme: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  typography: {
    headingFont: string
    bodyFont: string
  }
  keyFeatures: string[]
  moodKeywords: string[]
}

export interface BlogArticle {
  title: string
  slug: string
  metaDescription: string
  keywords: string[]
  content: string // Full HTML/markdown content
  estimatedReadTime: number
}

export interface ProjectSection {
  name: string
  description: string
  features: string[]
  codeHint: string // Implementation guidance
}

export interface GeneratedImage {
  prompt: string
  imageUrl: string
  altText: string
  usage: string // hero, blog-1, project-gallery, etc.
}

export interface ProjectState {
  id: string
  status: 'analyzing' | 'designing' | 'awaiting_design_choice' | 'generating_content' | 'generating_images' | 'generating_code' | 'review' | 'revising' | 'completed' | 'failed'
  brief: ProjectBrief
  analysis?: WebsiteAnalysis
  designConcepts?: DesignConcept[]
  chosenDesign?: DesignConcept
  sections?: ProjectSection[]
  blogArticles?: BlogArticle[]
  generatedImages?: GeneratedImage[]
  files?: Record<string, string>
  githubUrl?: string
  vercelUrl?: string
  feedback?: string[] // User feedback history
  iterations: number
  error?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// BRIEF PARSER
// ============================================

export async function parseBrief(rawBrief: string): Promise<ProjectBrief> {
  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Analyzuj toto zadání pro tvorbu webu a extrahuj strukturované informace.

ZADÁNÍ:
${rawBrief}

Odpověz POUZE validním JSON:
{
  "url": "URL existujícího webu nebo null",
  "clientName": "Název klienta/firmy",
  "description": "Stručný popis projektu (2-3 věty)",
  "features": ["feature1", "feature2", ...],
  "style": "dark|light|auto",
  "mood": ["modern", "interactive", ...]
}

Pro features extrahuj všechny požadavky jako:
- "Responzivní design"
- "10 blogových článků o [téma]"
- "Sekce [název] s [popis]"
- "Tmavý design"
- atd.`,
    }],
  }))

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  // Fallback - basic parsing
  return {
    clientName: 'Neznámý klient',
    description: rawBrief.substring(0, 200),
    features: [rawBrief],
    style: 'auto',
    mood: ['modern'],
  }
}

// ============================================
// DESIGN CONCEPTS GENERATOR
// ============================================

export async function generateDesignConcepts(
  brief: ProjectBrief,
  analysis: WebsiteAnalysis | null
): Promise<DesignConcept[]> {
  const analysisContext = analysis ? `
ANALÝZA SOUČASNÉHO WEBU:
- URL: ${analysis.crawl.url}
- Title: ${analysis.crawl.title}
- Tech stack: ${analysis.crawl.techStack.join(', ') || 'Neznámý'}
- Skóre: ${analysis.summary.overallScore}/100
- Silné stránky: ${analysis.summary.strengths.join(', ')}
- Slabé stránky: ${analysis.summary.weaknesses.join(', ')}
` : ''

  const stylePreference = brief.style === 'dark'
    ? 'Všechny návrhy MUSÍ být tmavé (dark mode) s tmavým pozadím.'
    : brief.style === 'light'
      ? 'Všechny návrhy by měly být světlé.'
      : 'Nabídni mix světlých a tmavých variant.'

  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Jsi expert na web design. Vytvoř 3 různé designové koncepty.

ZADÁNÍ:
${brief.description}

POŽADOVANÉ FEATURES:
${brief.features.map(f => `- ${f}`).join('\n')}

POŽADOVANÝ STYL:
${stylePreference}
Mood keywords: ${brief.mood?.join(', ') || 'modern, professional'}

${analysisContext}

Vytvoř 3 VÝRAZNĚ odlišné návrhy:
1. Minimalistický elegantní - čisté linie, hodně prostoru, sofistikovaný
2. Odvážný a kreativní - výrazné prvky, animace, unikátní layout
3. Profesionální důvěryhodný - solidní, spolehlivý dojem, jasná hierarchie

Odpověz POUZE validním JSON:
{
  "concepts": [
    {
      "name": "Název konceptu",
      "style": "minimalist|bold|corporate|elegant",
      "description": "Popis designu ve 2-3 větách",
      "colorScheme": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
      "typography": {
        "headingFont": "Google Font name",
        "bodyFont": "Google Font name"
      },
      "keyFeatures": ["feature1", "feature2", "feature3"],
      "moodKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`,
    }],
  }))

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0])
    return result.concepts || []
  }

  return []
}

// ============================================
// SECTIONS PLANNER
// ============================================

export async function planSections(
  brief: ProjectBrief,
  chosenDesign: DesignConcept
): Promise<ProjectSection[]> {
  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Navrhni strukturu webu (sekce/stránky) podle zadání.

KLIENT: ${brief.clientName}
POPIS: ${brief.description}

POŽADOVANÉ FEATURES:
${brief.features.map(f => `- ${f}`).join('\n')}

DESIGN: ${chosenDesign.name} (${chosenDesign.style})
${chosenDesign.description}

Navrhni sekce webu. Pro každou sekci uveď:
- Název
- Co sekce obsahuje
- Klíčové features/prvky
- Tip pro implementaci

Odpověz POUZE validním JSON:
{
  "sections": [
    {
      "name": "Hero",
      "description": "Hlavní úvodní sekce s call-to-action",
      "features": ["Velký nadpis", "CTA tlačítko", "Pozadí s gradientem"],
      "codeHint": "Použij full-width section s min-h-screen"
    },
    {
      "name": "Blog",
      "description": "Seznam blogových článků",
      "features": ["Grid layout", "Náhledy článků", "Filtry/kategorie"],
      "codeHint": "Dynamické načítání z /blog/[slug]"
    }
  ]
}`,
    }],
  }))

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0])
    return result.sections || []
  }

  return []
}

// ============================================
// BLOG ARTICLES GENERATOR
// ============================================

export async function generateBlogArticles(
  brief: ProjectBrief,
  count: number = 10,
  topic?: string,
  onProgress?: (current: number, total: number, title: string) => void
): Promise<BlogArticle[]> {
  // First, generate article topics
  const topicsResponse = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Vygeneruj ${count} témat pro blogové články.

KLIENT: ${brief.clientName}
OBOR: ${brief.description}
${topic ? `TÉMA: ${topic}` : ''}

Vygeneruj ${count} témat článků, které:
- Jsou relevantní pro cílovou skupinu
- Mají SEO potenciál
- Pokrývají různé aspekty oboru

Odpověz POUZE validním JSON:
{
  "topics": [
    {
      "title": "Titulek článku (50-60 znaků)",
      "slug": "url-slug",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "outline": "Stručný outline článku"
    }
  ]
}`,
    }],
  }))

  const topicsText = topicsResponse.content[0].type === 'text' ? topicsResponse.content[0].text : ''
  const topicsMatch = topicsText.match(/\{[\s\S]*\}/)

  if (!topicsMatch) return []

  const { topics } = JSON.parse(topicsMatch[0])
  const articles: BlogArticle[] = []

  // Generate articles SEQUENTIALLY to avoid rate limits
  for (let i = 0; i < Math.min(topics.length, count); i++) {
    const articleTopic = topics[i] as { title: string; slug: string; keywords: string[]; outline: string }

    // Notify progress
    if (onProgress) {
      onProgress(i + 1, count, articleTopic.title)
    }

    try {
      const articleResponse = await callWithRetry(() => anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Napiš SEO optimalizovaný blogový článek.

TÉMA: ${articleTopic.title}
KEYWORDS: ${articleTopic.keywords.join(', ')}
OUTLINE: ${articleTopic.outline}

Napiš článek cca 800-1200 slov, který:
- Je SEO optimalizovaný
- Má jasnou strukturu (H2, H3)
- Obsahuje praktické rady
- Je napsaný pro českou cílovou skupinu

Odpověz POUZE validním JSON:
{
  "title": "${articleTopic.title}",
  "slug": "${articleTopic.slug}",
  "metaDescription": "Meta description (max 160 znaků)",
  "keywords": ${JSON.stringify(articleTopic.keywords)},
  "content": "Celý obsah článku v markdown formátu",
  "estimatedReadTime": 5
}`,
        }],
      }))

      const articleText = articleResponse.content[0].type === 'text' ? articleResponse.content[0].text : ''
      const articleMatch = articleText.match(/\{[\s\S]*\}/)

      if (articleMatch) {
        articles.push(JSON.parse(articleMatch[0]) as BlogArticle)
      }

      // Small delay between articles to avoid rate limits
      if (i < count - 1) {
        await sleep(1000)
      }
    } catch (error) {
      console.error(`Failed to generate article ${i + 1}:`, error)
      // Continue with other articles even if one fails
    }
  }

  return articles
}

// ============================================
// IMAGE GENERATOR (via Meshy)
// ============================================

export async function generateProjectImages(
  brief: ProjectBrief,
  design: DesignConcept,
  imageNeeds: { usage: string; description: string }[]
): Promise<GeneratedImage[]> {
  const client = createMeshyClient()

  if (!client) {
    console.warn('Meshy client not available - skipping image generation')
    return []
  }

  const images: GeneratedImage[] = []

  for (const need of imageNeeds) {
    try {
      const prompt = `${need.description}, ${design.moodKeywords.join(', ')}, professional photography, high quality, ${design.style} style`

      const imageUrl = await client.generateImage(prompt, {
        model: 'nano-banana-pro',
        negativePrompt: 'blurry, low quality, distorted, ugly, bad composition',
      })

      images.push({
        prompt,
        imageUrl,
        altText: need.description,
        usage: need.usage,
      })
    } catch (error) {
      console.error(`Failed to generate image for ${need.usage}:`, error)
    }
  }

  return images
}

// ============================================
// CODE GENERATOR
// ============================================

export async function generateWebsiteCode(
  brief: ProjectBrief,
  design: DesignConcept,
  sections: ProjectSection[],
  articles: BlogArticle[]
): Promise<Record<string, string>> {
  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192, // Reduced to help with rate limits
    system: AGENT_PROMPTS.web_developer,
    messages: [{
      role: 'user',
      content: `Vytvoř kompletní Next.js 14 web.

## KLIENT
${brief.clientName}

## DESIGN
Název: ${design.name}
Styl: ${design.style}
Popis: ${design.description}

### Barvy
- Primary: ${design.colorScheme.primary}
- Secondary: ${design.colorScheme.secondary}
- Accent: ${design.colorScheme.accent}
- Background: ${design.colorScheme.background}
- Text: ${design.colorScheme.text}

### Typografie
- Nadpisy: ${design.typography.headingFont}
- Text: ${design.typography.bodyFont}

## SEKCE
${sections.map(s => `
### ${s.name}
${s.description}
Features: ${s.features.join(', ')}
Hint: ${s.codeHint}
`).join('\n')}

## BLOG ČLÁNKY (${articles.length})
${articles.map(a => `- ${a.title} (/${a.slug})`).join('\n')}

## POŽADAVKY
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Plně responzivní (mobile-first)
- Semantic HTML
- Optimalizováno pro Core Web Vitals

Vytvoř kompletní strukturu:
- package.json
- tailwind.config.js
- app/layout.tsx (s Google Fonts)
- app/globals.css
- app/page.tsx (homepage se všemi sekcemi)
- app/blog/page.tsx (výpis článků)
- app/blog/[slug]/page.tsx (detail článku)
- components/*.tsx (potřebné komponenty)

Odpověz POUZE validním JSON:
{
  "files": {
    "package.json": "obsah",
    "app/page.tsx": "obsah",
    ...
  }
}`,
    }],
  }))

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Try to extract JSON
  let jsonStr = text
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    const result = JSON.parse(objectMatch[0])
    return result.files || {}
  }

  throw new Error('Failed to generate website code')
}

// ============================================
// REVISION HANDLER
// ============================================

export async function reviseCode(
  currentCode: Record<string, string>,
  feedback: string,
  design: DesignConcept
): Promise<Record<string, string>> {
  // Get Supervisor review of the feedback
  const reviewResult = await supervisorReview({
    originalTask: feedback,
    agentOutput: JSON.stringify(Object.keys(currentCode)),
    agentType: 'web_developer',
    iterationNumber: 1,
  })

  const refinedFeedback = reviewResult.feedback || feedback

  const response = await callWithRetry(() => anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192, // Reduced to help with rate limits
    system: AGENT_PROMPTS.web_developer,
    messages: [{
      role: 'user',
      content: `Uprav existující web podle feedbacku.

## AKTUÁLNÍ SOUBORY
${Object.entries(currentCode).map(([path, content]) => `
### ${path}
\`\`\`
${content.substring(0, 500)}...
\`\`\`
`).join('\n')}

## FEEDBACK
${refinedFeedback}

## DESIGN (zachovat)
${design.name} - ${design.description}
Barvy: ${design.colorScheme.primary}, ${design.colorScheme.secondary}

Proveď požadované změny a vrať KOMPLETNÍ aktualizované soubory.

Odpověz POUZE validním JSON:
{
  "files": {
    "app/page.tsx": "kompletní nový obsah",
    ...
  },
  "changes": ["Popis změny 1", "Popis změny 2"]
}`,
    }],
  }))

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0])
    // Merge new files with existing
    return { ...currentCode, ...result.files }
  }

  return currentCode
}

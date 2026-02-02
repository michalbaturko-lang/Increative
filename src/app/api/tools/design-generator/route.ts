import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'
import { analyzeWebsite, WebsiteAnalysis } from '@/lib/web-tools'

interface DesignConcept {
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
  targetAudience: string
  moodKeywords: string[]
}

interface DesignGeneratorResult {
  analysis: WebsiteAnalysis
  concepts: DesignConcept[]
  recommendation: {
    bestChoice: number
    reason: string
  }
}

const DESIGN_PROMPT = `Jsi expert na web design a UX/UI. Na základě analýzy webu vytvoř 3 různé návrhy redesignu.

Každý návrh musí být výrazně odlišný:
1. **Moderní minimalistický** - čisté linie, hodně bílého prostoru, jednoduchý
2. **Odvážný a kreativní** - výrazné barvy, netradiční layout, unikátní prvky
3. **Profesionální a důvěryhodný** - konzervativnější, důraz na čitelnost a důvěru

Pro každý návrh uveď:
- Název konceptu
- Styl (minimalist/bold/corporate/playful/elegant)
- Popis designu (2-3 věty)
- Barevné schéma (hex kódy)
- Typografie (doporuč Google Fonts)
- Klíčové features (3-5 bodů)
- Cílová skupina
- Mood keywords (3-5 slov)

Na konci doporuč, který koncept je nejlepší a proč.

Odpověz POUZE validním JSON bez markdown formátování.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, brief, skipAnalysis } = body

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL je povinná',
      }, { status: 400 })
    }

    // Step 1: Analyze existing website (unless skipped)
    let analysis: WebsiteAnalysis | null = null
    if (!skipAnalysis) {
      analysis = await analyzeWebsite(url, {
        includePageSpeed: true,
        includeScreenshot: true,
      })
    }

    // Step 2: Generate design concepts using Claude
    const analysisContext = analysis ? `
ANALÝZA SOUČASNÉHO WEBU:
URL: ${analysis.crawl.url}
Title: ${analysis.crawl.title}
Popis: ${analysis.crawl.description}
Technologie: ${analysis.crawl.techStack.join(', ') || 'Neznámé'}
Počet slov: ${analysis.crawl.wordCount}
H1: ${analysis.crawl.h1.join(', ') || 'Žádný'}

SKÓRE:
- Celkové: ${analysis.summary.overallScore}/100
${analysis.pageSpeed ? `- Výkon: ${analysis.pageSpeed.performance}/100
- SEO: ${analysis.pageSpeed.seo}/100
- Přístupnost: ${analysis.pageSpeed.accessibility}/100` : ''}

SILNÉ STRÁNKY:
${analysis.summary.strengths.map(s => `- ${s}`).join('\n')}

SLABÉ STRÁNKY:
${analysis.summary.weaknesses.map(w => `- ${w}`).join('\n')}

DOPORUČENÍ:
${analysis.summary.recommendations.map(r => `- ${r}`).join('\n')}
` : 'Analýza webu nebyla provedena.'

    const userBrief = brief ? `\nPOŽADAVKY KLIENTA:\n${brief}` : ''

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${DESIGN_PROMPT}

${analysisContext}
${userBrief}

Vytvoř 3 různé designové koncepty ve formátu:
{
  "concepts": [
    {
      "name": "Název konceptu",
      "style": "minimalist|bold|corporate|playful|elegant",
      "description": "Popis designu",
      "colorScheme": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
      "typography": {
        "headingFont": "Font name",
        "bodyFont": "Font name"
      },
      "keyFeatures": ["feature1", "feature2", "feature3"],
      "targetAudience": "Popis cílové skupiny",
      "moodKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ],
  "recommendation": {
    "bestChoice": 0,
    "reason": "Důvod doporučení"
  }
}`,
        },
      ],
    })

    const outputText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON response
    let designResult: { concepts: DesignConcept[]; recommendation: { bestChoice: number; reason: string } }

    try {
      // Try to extract JSON from response
      const jsonMatch = outputText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        designResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Nepodařilo se vygenerovat návrhy designu',
        rawOutput: outputText,
      }, { status: 500 })
    }

    const result: DesignGeneratorResult = {
      analysis: analysis!,
      concepts: designResult.concepts,
      recommendation: designResult.recommendation,
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Design Generator API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Neznámá chyba',
    }, { status: 500 })
  }
}

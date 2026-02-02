/**
 * SEO Project Workflow
 *
 * Komplexní workflow pro SEO audity a analýzy
 */

import { anthropic, AGENT_PROMPTS, supervisorReview } from './claude'
import { analyzeWebsite, WebsiteAnalysis, runPageSpeedInsights } from './web-tools'

// ============================================
// TYPES
// ============================================

export interface SEOProjectBrief {
  url: string
  clientName: string
  competitors?: string[]
  targetKeywords?: string[]
  goals?: string[]
  industry?: string
}

export interface TechnicalSEOAudit {
  score: number
  issues: {
    critical: SEOIssue[]
    warning: SEOIssue[]
    info: SEOIssue[]
  }
  recommendations: string[]
}

export interface SEOIssue {
  type: string
  description: string
  impact: 'high' | 'medium' | 'low'
  howToFix: string
}

export interface OnPageSEOAudit {
  score: number
  title: {
    current: string
    length: number
    issues: string[]
    suggestion: string
  }
  metaDescription: {
    current: string
    length: number
    issues: string[]
    suggestion: string
  }
  headings: {
    h1Count: number
    h2Count: number
    structure: string[]
    issues: string[]
  }
  content: {
    wordCount: number
    readabilityScore: number
    keywordDensity: Record<string, number>
    issues: string[]
  }
  images: {
    total: number
    withoutAlt: number
    issues: string[]
  }
}

export interface KeywordAnalysis {
  keyword: string
  searchVolume?: number
  difficulty?: number
  currentRanking?: number
  opportunity: 'high' | 'medium' | 'low'
  suggestedContent?: string
}

export interface CompetitorAnalysis {
  url: string
  strengths: string[]
  weaknesses: string[]
  keywordOverlap: string[]
  contentGaps: string[]
}

export interface SEORecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'technical' | 'content' | 'onpage' | 'offpage' | 'local'
  title: string
  description: string
  estimatedImpact: string
  implementationSteps: string[]
}

export interface SEOProjectState {
  id: string
  status: 'analyzing' | 'technical_audit' | 'onpage_audit' | 'keyword_analysis' | 'competitor_analysis' | 'generating_report' | 'review' | 'completed' | 'failed'
  brief: SEOProjectBrief
  websiteAnalysis?: WebsiteAnalysis
  technicalAudit?: TechnicalSEOAudit
  onPageAudit?: OnPageSEOAudit
  keywordAnalysis?: KeywordAnalysis[]
  competitorAnalysis?: CompetitorAnalysis[]
  recommendations?: SEORecommendation[]
  fullReport?: string
  feedback?: string[]
  iterations: number
  createdAt: string
  updatedAt: string
}

// ============================================
// BRIEF PARSER
// ============================================

export async function parseSEOBrief(rawBrief: string): Promise<SEOProjectBrief> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Analyzuj toto zadání pro SEO audit a extrahuj strukturované informace.

ZADÁNÍ:
${rawBrief}

Odpověz POUZE validním JSON:
{
  "url": "URL webu k analýze",
  "clientName": "Název klienta/firmy",
  "competitors": ["url1", "url2"],
  "targetKeywords": ["keyword1", "keyword2"],
  "goals": ["cíl1", "cíl2"],
  "industry": "odvětví"
}

Pokud některé informace chybí, použij null nebo prázdné pole.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  // Fallback - try to extract URL
  const urlMatch = rawBrief.match(/https?:\/\/[^\s]+/)
  return {
    url: urlMatch?.[0] || '',
    clientName: 'Neznámý klient',
  }
}

// ============================================
// TECHNICAL SEO AUDIT
// ============================================

export async function performTechnicalAudit(
  websiteAnalysis: WebsiteAnalysis
): Promise<TechnicalSEOAudit> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: AGENT_PROMPTS.seo_analyst,
    messages: [{
      role: 'user',
      content: `Proveď technický SEO audit na základě těchto dat:

URL: ${websiteAnalysis.crawl.url}
Tech Stack: ${websiteAnalysis.crawl.techStack.join(', ')}
Load Time: ${websiteAnalysis.crawl.loadTime}ms

PageSpeed Insights:
${websiteAnalysis.pageSpeed ? `
- Performance: ${websiteAnalysis.pageSpeed.performance}/100
- Accessibility: ${websiteAnalysis.pageSpeed.accessibility}/100
- Best Practices: ${websiteAnalysis.pageSpeed.bestPractices}/100
- SEO: ${websiteAnalysis.pageSpeed.seo}/100
- FCP: ${websiteAnalysis.pageSpeed.metrics.firstContentfulPaint}
- LCP: ${websiteAnalysis.pageSpeed.metrics.largestContentfulPaint}
- TBT: ${websiteAnalysis.pageSpeed.metrics.totalBlockingTime}
- CLS: ${websiteAnalysis.pageSpeed.metrics.cumulativeLayoutShift}
` : 'Nedostupné'}

Meta:
- Title: ${websiteAnalysis.crawl.title} (${websiteAnalysis.crawl.title?.length || 0} znaků)
- Description: ${websiteAnalysis.crawl.description} (${websiteAnalysis.crawl.description?.length || 0} znaků)
- Canonical: ${websiteAnalysis.crawl.canonical || 'Není'}

Odpověz POUZE validním JSON:
{
  "score": 75,
  "issues": {
    "critical": [
      {
        "type": "missing_ssl",
        "description": "Web nepoužívá HTTPS",
        "impact": "high",
        "howToFix": "Nainstalujte SSL certifikát"
      }
    ],
    "warning": [],
    "info": []
  },
  "recommendations": ["doporučení 1", "doporučení 2"]
}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  return {
    score: 0,
    issues: { critical: [], warning: [], info: [] },
    recommendations: [],
  }
}

// ============================================
// ON-PAGE SEO AUDIT
// ============================================

export async function performOnPageAudit(
  websiteAnalysis: WebsiteAnalysis
): Promise<OnPageSEOAudit> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: AGENT_PROMPTS.seo_analyst,
    messages: [{
      role: 'user',
      content: `Proveď on-page SEO audit:

URL: ${websiteAnalysis.crawl.url}
Title: ${websiteAnalysis.crawl.title}
Description: ${websiteAnalysis.crawl.description}
H1: ${websiteAnalysis.crawl.h1.join(', ')}
H2 count: ${websiteAnalysis.crawl.h2.length}
Word count: ${websiteAnalysis.crawl.wordCount}
Image count: ${websiteAnalysis.crawl.images.length}

Odpověz POUZE validním JSON:
{
  "score": 70,
  "title": {
    "current": "${websiteAnalysis.crawl.title}",
    "length": ${websiteAnalysis.crawl.title?.length || 0},
    "issues": ["problém 1"],
    "suggestion": "Lepší title tag"
  },
  "metaDescription": {
    "current": "${websiteAnalysis.crawl.description?.substring(0, 100)}...",
    "length": ${websiteAnalysis.crawl.description?.length || 0},
    "issues": [],
    "suggestion": ""
  },
  "headings": {
    "h1Count": ${websiteAnalysis.crawl.h1.length},
    "h2Count": ${websiteAnalysis.crawl.h2.length},
    "structure": ["H1 > H2 > H3"],
    "issues": []
  },
  "content": {
    "wordCount": ${websiteAnalysis.crawl.wordCount},
    "readabilityScore": 60,
    "keywordDensity": {},
    "issues": []
  },
  "images": {
    "total": ${websiteAnalysis.crawl.images.length},
    "withoutAlt": 0,
    "issues": []
  }
}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  return {
    score: 0,
    title: { current: '', length: 0, issues: [], suggestion: '' },
    metaDescription: { current: '', length: 0, issues: [], suggestion: '' },
    headings: { h1Count: 0, h2Count: 0, structure: [], issues: [] },
    content: { wordCount: 0, readabilityScore: 0, keywordDensity: {}, issues: [] },
    images: { total: 0, withoutAlt: 0, issues: [] },
  }
}

// ============================================
// KEYWORD ANALYSIS
// ============================================

export async function analyzeKeywords(
  brief: SEOProjectBrief,
  websiteAnalysis: WebsiteAnalysis
): Promise<KeywordAnalysis[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: AGENT_PROMPTS.seo_analyst,
    messages: [{
      role: 'user',
      content: `Analyzuj klíčová slova pro tento web:

URL: ${brief.url}
Odvětví: ${brief.industry || 'Neznámé'}
Cílová klíčová slova: ${brief.targetKeywords?.join(', ') || 'Neurčena'}

Obsah webu:
Title: ${websiteAnalysis.crawl.title}
H1: ${websiteAnalysis.crawl.h1.join(', ')}
H2: ${websiteAnalysis.crawl.h2.slice(0, 5).join(', ')}

Navrhni 10 klíčových slov s analýzou. Odpověz POUZE validním JSON:
{
  "keywords": [
    {
      "keyword": "klíčové slovo",
      "searchVolume": 1000,
      "difficulty": 45,
      "currentRanking": null,
      "opportunity": "high",
      "suggestedContent": "Návrh článku nebo stránky"
    }
  ]
}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0])
    return result.keywords || []
  }

  return []
}

// ============================================
// COMPETITOR ANALYSIS
// ============================================

export async function analyzeCompetitors(
  brief: SEOProjectBrief,
  websiteAnalysis: WebsiteAnalysis
): Promise<CompetitorAnalysis[]> {
  if (!brief.competitors || brief.competitors.length === 0) {
    // Generate competitor suggestions
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Na základě těchto informací navrhni 3 pravděpodobné konkurenty:

URL: ${brief.url}
Odvětví: ${brief.industry || 'Neznámé'}
Obsah: ${websiteAnalysis.crawl.title} - ${websiteAnalysis.crawl.description}

Odpověz POUZE validním JSON:
{
  "competitors": [
    {
      "url": "https://example.com",
      "strengths": ["silná stránka 1"],
      "weaknesses": ["slabá stránka 1"],
      "keywordOverlap": ["keyword1"],
      "contentGaps": ["chybějící obsah"]
    }
  ]
}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return result.competitors || []
    }

    return []
  }

  // Analyze provided competitors
  const analyses: CompetitorAnalysis[] = []

  for (const competitorUrl of brief.competitors.slice(0, 3)) {
    try {
      const competitorAnalysis = await analyzeWebsite(competitorUrl, { includePageSpeed: false })

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Porovnej tyto dva weby:

KLIENT:
- URL: ${brief.url}
- Title: ${websiteAnalysis.crawl.title}
- H1: ${websiteAnalysis.crawl.h1.join(', ')}

KONKURENT:
- URL: ${competitorUrl}
- Title: ${competitorAnalysis.crawl.title}
- H1: ${competitorAnalysis.crawl.h1.join(', ')}

Odpověz POUZE validním JSON:
{
  "url": "${competitorUrl}",
  "strengths": ["co dělá konkurent lépe"],
  "weaknesses": ["co dělá konkurent hůře"],
  "keywordOverlap": ["společná klíčová slova"],
  "contentGaps": ["obsah který klient nemá"]
}`,
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        analyses.push(JSON.parse(jsonMatch[0]))
      }
    } catch (error) {
      console.error(`Failed to analyze competitor ${competitorUrl}:`, error)
    }
  }

  return analyses
}

// ============================================
// GENERATE RECOMMENDATIONS
// ============================================

export async function generateRecommendations(
  brief: SEOProjectBrief,
  technicalAudit: TechnicalSEOAudit,
  onPageAudit: OnPageSEOAudit,
  keywordAnalysis: KeywordAnalysis[],
  competitorAnalysis: CompetitorAnalysis[]
): Promise<SEORecommendation[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: AGENT_PROMPTS.seo_analyst,
    messages: [{
      role: 'user',
      content: `Na základě kompletního SEO auditu vytvoř prioritizovaná doporučení:

TECHNICKÝ AUDIT (skóre ${technicalAudit.score}/100):
- Kritické problémy: ${technicalAudit.issues.critical.length}
- Varování: ${technicalAudit.issues.warning.length}

ON-PAGE AUDIT (skóre ${onPageAudit.score}/100):
- Title: ${onPageAudit.title.issues.join(', ') || 'OK'}
- Meta description: ${onPageAudit.metaDescription.issues.join(', ') || 'OK'}
- Headings: ${onPageAudit.headings.issues.join(', ') || 'OK'}

KLÍČOVÁ SLOVA:
${keywordAnalysis.slice(0, 5).map(k => `- ${k.keyword} (příležitost: ${k.opportunity})`).join('\n')}

KONKURENCE:
${competitorAnalysis.map(c => `- ${c.url}: content gaps: ${c.contentGaps.join(', ')}`).join('\n')}

Vytvoř 10-15 prioritizovaných doporučení. Odpověz POUZE validním JSON:
{
  "recommendations": [
    {
      "priority": "critical",
      "category": "technical",
      "title": "Název doporučení",
      "description": "Detailní popis",
      "estimatedImpact": "Očekávaný dopad na SEO",
      "implementationSteps": ["krok 1", "krok 2"]
    }
  ]
}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0])
    return result.recommendations || []
  }

  return []
}

// ============================================
// GENERATE FULL REPORT
// ============================================

export async function generateFullReport(
  brief: SEOProjectBrief,
  websiteAnalysis: WebsiteAnalysis,
  technicalAudit: TechnicalSEOAudit,
  onPageAudit: OnPageSEOAudit,
  keywordAnalysis: KeywordAnalysis[],
  competitorAnalysis: CompetitorAnalysis[],
  recommendations: SEORecommendation[]
): Promise<string> {
  const overallScore = Math.round((technicalAudit.score + onPageAudit.score) / 2)

  const report = `# SEO Audit Report
## ${brief.clientName}
**URL:** ${brief.url}
**Datum:** ${new Date().toLocaleDateString('cs-CZ')}

---

## Executive Summary

**Celkové skóre: ${overallScore}/100**

- Technické SEO: ${technicalAudit.score}/100
- On-page SEO: ${onPageAudit.score}/100

### Klíčové nálezy

${technicalAudit.issues.critical.length > 0 ? `⚠️ **${technicalAudit.issues.critical.length} kritických problémů** vyžaduje okamžitou pozornost` : '✅ Žádné kritické technické problémy'}

${onPageAudit.title.issues.length > 0 ? `⚠️ Title tag: ${onPageAudit.title.issues.join(', ')}` : '✅ Title tag je v pořádku'}

${onPageAudit.metaDescription.issues.length > 0 ? `⚠️ Meta description: ${onPageAudit.metaDescription.issues.join(', ')}` : '✅ Meta description je v pořádku'}

---

## 1. Technické SEO

### Skóre: ${technicalAudit.score}/100

${technicalAudit.issues.critical.length > 0 ? `
### Kritické problémy
${technicalAudit.issues.critical.map(i => `
#### ${i.type}
- **Popis:** ${i.description}
- **Dopad:** ${i.impact}
- **Řešení:** ${i.howToFix}
`).join('\n')}
` : ''}

${technicalAudit.issues.warning.length > 0 ? `
### Varování
${technicalAudit.issues.warning.map(i => `- **${i.type}:** ${i.description}`).join('\n')}
` : ''}

### PageSpeed Insights
${websiteAnalysis.pageSpeed ? `
| Metrika | Hodnota |
|---------|---------|
| Performance | ${websiteAnalysis.pageSpeed.performance}/100 |
| Accessibility | ${websiteAnalysis.pageSpeed.accessibility}/100 |
| Best Practices | ${websiteAnalysis.pageSpeed.bestPractices}/100 |
| SEO | ${websiteAnalysis.pageSpeed.seo}/100 |
` : 'Data nejsou k dispozici'}

---

## 2. On-page SEO

### Skóre: ${onPageAudit.score}/100

### Title Tag
- **Aktuální:** ${onPageAudit.title.current}
- **Délka:** ${onPageAudit.title.length} znaků
${onPageAudit.title.suggestion ? `- **Doporučení:** ${onPageAudit.title.suggestion}` : ''}

### Meta Description
- **Aktuální:** ${onPageAudit.metaDescription.current}
- **Délka:** ${onPageAudit.metaDescription.length} znaků
${onPageAudit.metaDescription.suggestion ? `- **Doporučení:** ${onPageAudit.metaDescription.suggestion}` : ''}

### Struktura nadpisů
- H1: ${onPageAudit.headings.h1Count}
- H2: ${onPageAudit.headings.h2Count}

### Obsah
- Počet slov: ${onPageAudit.content.wordCount}
- Čitelnost: ${onPageAudit.content.readabilityScore}/100

---

## 3. Analýza klíčových slov

| Klíčové slovo | Příležitost | Doporučený obsah |
|---------------|-------------|------------------|
${keywordAnalysis.slice(0, 10).map(k => `| ${k.keyword} | ${k.opportunity} | ${k.suggestedContent || '-'} |`).join('\n')}

---

## 4. Konkurenční analýza

${competitorAnalysis.map(c => `
### ${c.url}

**Silné stránky konkurenta:**
${c.strengths.map(s => `- ${s}`).join('\n')}

**Slabé stránky konkurenta:**
${c.weaknesses.map(w => `- ${w}`).join('\n')}

**Content gaps (příležitosti):**
${c.contentGaps.map(g => `- ${g}`).join('\n')}
`).join('\n')}

---

## 5. Prioritizovaná doporučení

${recommendations.map((r, i) => `
### ${i + 1}. ${r.title}
- **Priorita:** ${r.priority}
- **Kategorie:** ${r.category}
- **Popis:** ${r.description}
- **Očekávaný dopad:** ${r.estimatedImpact}

**Implementační kroky:**
${r.implementationSteps.map((s, j) => `${j + 1}. ${s}`).join('\n')}
`).join('\n')}

---

## Závěr

Tento audit identifikoval ${recommendations.filter(r => r.priority === 'critical').length} kritických, ${recommendations.filter(r => r.priority === 'high').length} vysokých a ${recommendations.filter(r => r.priority === 'medium').length} středních priorit pro zlepšení SEO.

Doporučujeme začít s kritickými a vysokými prioritami pro maximální dopad na organickou viditelnost.

---

*Vygenerováno pomocí FSA SEO Analyst*
`

  return report
}

// ============================================
// REVISE REPORT
// ============================================

export async function reviseReport(
  currentReport: string,
  feedback: string
): Promise<string> {
  // Get Supervisor review
  const reviewResult = await supervisorReview({
    originalTask: feedback,
    agentOutput: currentReport.substring(0, 2000),
    agentType: 'seo_analyst',
    iterationNumber: 1,
  })

  const refinedFeedback = reviewResult.feedback || feedback

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: AGENT_PROMPTS.seo_analyst,
    messages: [{
      role: 'user',
      content: `Uprav SEO audit report podle feedbacku:

AKTUÁLNÍ REPORT (zkráceno):
${currentReport.substring(0, 4000)}...

FEEDBACK:
${refinedFeedback}

Vrať KOMPLETNÍ upravený report v markdown formátu.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return text || currentReport
}

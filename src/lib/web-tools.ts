/**
 * Web Analysis Tools for Web Developer Agent
 *
 * Tools for crawling, analyzing, and evaluating websites
 */

// ============================================
// WEB CRAWLER / ANALYZER
// ============================================

export interface CrawlResult {
  url: string
  title: string
  description: string
  h1: string[]
  h2: string[]
  links: { href: string; text: string }[]
  images: { src: string; alt: string }[]
  meta: Record<string, string>
  textContent: string
  wordCount: number
  techStack: string[]
  errors: string[]
}

export async function crawlWebsite(url: string): Promise<CrawlResult> {
  try {
    // Normalize URL
    if (!url.startsWith('http')) {
      url = `https://${url}`
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FSA-WebDeveloper/1.0; +https://increative.cz)',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    // Parse HTML (basic parsing without jsdom on edge)
    const result: CrawlResult = {
      url,
      title: extractTag(html, 'title'),
      description: extractMeta(html, 'description'),
      h1: extractAllTags(html, 'h1'),
      h2: extractAllTags(html, 'h2'),
      links: extractLinks(html),
      images: extractImages(html),
      meta: extractAllMeta(html),
      textContent: extractTextContent(html),
      wordCount: 0,
      techStack: detectTechStack(html),
      errors: [],
    }

    result.wordCount = result.textContent.split(/\s+/).filter(Boolean).length

    return result
  } catch (error) {
    return {
      url,
      title: '',
      description: '',
      h1: [],
      h2: [],
      links: [],
      images: [],
      meta: {},
      textContent: '',
      wordCount: 0,
      techStack: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

function extractTag(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')
  const match = html.match(regex)
  return match ? match[1].trim() : ''
}

function extractAllTags(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi')
  const matches = html.matchAll(regex)
  return Array.from(matches).map(m => m[1].trim()).filter(Boolean)
}

function extractMeta(html: string, name: string): string {
  const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i')
  const match = html.match(regex)
  if (match) return match[1]

  // Try reverse order (content before name)
  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i')
  const match2 = html.match(regex2)
  return match2 ? match2[1] : ''
}

function extractAllMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {}
  const regex = /<meta[^>]*>/gi
  let match

  while ((match = regex.exec(html)) !== null) {
    const tag = match[0]
    const nameMatch = tag.match(/name=["']([^"']*)["']/i)
    const contentMatch = tag.match(/content=["']([^"']*)["']/i)
    const propertyMatch = tag.match(/property=["']([^"']*)["']/i)

    if (contentMatch) {
      const key = nameMatch?.[1] || propertyMatch?.[1]
      if (key) {
        meta[key] = contentMatch[1]
      }
    }
  }

  return meta
}

function extractLinks(html: string): { href: string; text: string }[] {
  const regex = /<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)</gi
  const matches = html.matchAll(regex)
  return Array.from(matches)
    .map(m => ({ href: m[1], text: m[2].trim() }))
    .filter(l => l.href && !l.href.startsWith('#') && !l.href.startsWith('javascript:'))
    .slice(0, 50) // Limit to 50 links
}

function extractImages(html: string): { src: string; alt: string }[] {
  const regex = /<img[^>]*src=["']([^"']*)["'][^>]*>/gi
  const matches = html.matchAll(regex)
  return Array.from(matches)
    .map(m => {
      const altMatch = m[0].match(/alt=["']([^"']*)["']/i)
      return { src: m[1], alt: altMatch?.[1] || '' }
    })
    .slice(0, 30) // Limit to 30 images
}

function extractTextContent(html: string): string {
  // Remove scripts, styles, and HTML tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.substring(0, 5000) // Limit text content
}

function detectTechStack(html: string): string[] {
  const stack: string[] = []

  // Frameworks
  if (html.includes('__next') || html.includes('_next')) stack.push('Next.js')
  if (html.includes('__nuxt') || html.includes('_nuxt')) stack.push('Nuxt.js')
  if (html.includes('ng-') || html.includes('angular')) stack.push('Angular')
  if (html.includes('data-reactroot') || html.includes('__REACT')) stack.push('React')
  if (html.includes('data-v-') || html.includes('Vue')) stack.push('Vue.js')
  if (html.includes('wp-content') || html.includes('wordpress')) stack.push('WordPress')
  if (html.includes('shopify') || html.includes('Shopify')) stack.push('Shopify')
  if (html.includes('wix.com')) stack.push('Wix')
  if (html.includes('squarespace')) stack.push('Squarespace')
  if (html.includes('webflow')) stack.push('Webflow')

  // CSS Frameworks
  if (html.includes('tailwind') || html.includes('tw-')) stack.push('Tailwind CSS')
  if (html.includes('bootstrap')) stack.push('Bootstrap')
  if (html.includes('bulma')) stack.push('Bulma')

  // Analytics & Tools
  if (html.includes('google-analytics') || html.includes('gtag') || html.includes('UA-')) stack.push('Google Analytics')
  if (html.includes('gtm.js') || html.includes('googletagmanager')) stack.push('Google Tag Manager')
  if (html.includes('facebook.net/en_US/fbevents')) stack.push('Facebook Pixel')
  if (html.includes('hotjar')) stack.push('Hotjar')

  return Array.from(new Set(stack))
}

// ============================================
// PAGESPEED INSIGHTS
// ============================================

export interface PageSpeedResult {
  url: string
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  fcp: string // First Contentful Paint
  lcp: string // Largest Contentful Paint
  cls: string // Cumulative Layout Shift
  tbt: string // Total Blocking Time
  speedIndex: string
  opportunities: { title: string; description: string }[]
  diagnostics: { title: string; description: string }[]
  error?: string
}

export async function runPageSpeedInsights(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<PageSpeedResult> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY

  // Normalize URL
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }

  const baseResult: PageSpeedResult = {
    url,
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0,
    fcp: 'N/A',
    lcp: 'N/A',
    cls: 'N/A',
    tbt: 'N/A',
    speedIndex: 'N/A',
    opportunities: [],
    diagnostics: [],
  }

  if (!apiKey) {
    return {
      ...baseResult,
      error: 'GOOGLE_PAGESPEED_API_KEY není nastaven. PageSpeed Insights není dostupný.',
    }
  }

  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}&category=performance&category=accessibility&category=best-practices&category=seo`

    const response = await fetch(apiUrl)
    const data = await response.json()

    if (data.error) {
      return {
        ...baseResult,
        error: data.error.message || 'PageSpeed API error',
      }
    }

    const lighthouse = data.lighthouseResult
    const categories = lighthouse?.categories || {}
    const audits = lighthouse?.audits || {}

    return {
      url,
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
      lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
      cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
      tbt: audits['total-blocking-time']?.displayValue || 'N/A',
      speedIndex: audits['speed-index']?.displayValue || 'N/A',
      opportunities: extractOpportunities(audits),
      diagnostics: extractDiagnostics(audits),
    }
  } catch (error) {
    return {
      ...baseResult,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function extractOpportunities(audits: Record<string, { score?: number; title?: string; description?: string }>): { title: string; description: string }[] {
  const opportunities: { title: string; description: string }[] = []

  const opportunityAudits = [
    'render-blocking-resources',
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'uses-optimized-images',
    'uses-responsive-images',
    'efficient-animated-content',
    'duplicated-javascript',
    'legacy-javascript',
  ]

  for (const key of opportunityAudits) {
    const audit = audits[key]
    if (audit && audit.score !== undefined && audit.score < 1) {
      opportunities.push({
        title: audit.title || key,
        description: audit.description || '',
      })
    }
  }

  return opportunities.slice(0, 5)
}

function extractDiagnostics(audits: Record<string, { score?: number; title?: string; description?: string }>): { title: string; description: string }[] {
  const diagnostics: { title: string; description: string }[] = []

  const diagnosticAudits = [
    'dom-size',
    'critical-request-chains',
    'font-display',
    'uses-passive-event-listeners',
    'no-document-write',
    'uses-http2',
    'uses-long-cache-ttl',
  ]

  for (const key of diagnosticAudits) {
    const audit = audits[key]
    if (audit && audit.score !== undefined && audit.score < 1) {
      diagnostics.push({
        title: audit.title || key,
        description: audit.description || '',
      })
    }
  }

  return diagnostics.slice(0, 5)
}

// ============================================
// SCREENSHOT CAPTURE
// ============================================

export interface ScreenshotResult {
  url: string
  screenshotUrl: string
  error?: string
}

export async function captureScreenshot(url: string, fullPage: boolean = false): Promise<ScreenshotResult> {
  // Normalize URL
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }

  // Use free screenshot services
  // Option 1: microlink.io (free tier)
  const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`

  try {
    const response = await fetch(screenshotUrl)
    const data = await response.json()

    if (data.status === 'success' && data.data?.screenshot?.url) {
      return {
        url,
        screenshotUrl: data.data.screenshot.url,
      }
    }

    // Fallback: Use thum.io (free)
    const thumbUrl = `https://image.thum.io/get/${url}`

    return {
      url,
      screenshotUrl: thumbUrl,
    }
  } catch (error) {
    // Final fallback
    return {
      url,
      screenshotUrl: `https://image.thum.io/get/${url}`,
      error: error instanceof Error ? error.message : 'Screenshot service error',
    }
  }
}

// ============================================
// WEBSITE ANALYSIS SUMMARY
// ============================================

export interface WebsiteAnalysis {
  crawl: CrawlResult
  pageSpeed?: PageSpeedResult
  screenshot?: ScreenshotResult
  summary: {
    overallScore: number
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
}

export async function analyzeWebsite(url: string, options?: {
  includePageSpeed?: boolean
  includeScreenshot?: boolean
}): Promise<WebsiteAnalysis> {
  const includePageSpeed = options?.includePageSpeed ?? true
  const includeScreenshot = options?.includeScreenshot ?? true

  // Run all analyses in parallel
  const [crawl, pageSpeed, screenshot] = await Promise.all([
    crawlWebsite(url),
    includePageSpeed ? runPageSpeedInsights(url) : Promise.resolve(undefined),
    includeScreenshot ? captureScreenshot(url) : Promise.resolve(undefined),
  ])

  // Generate summary
  const strengths: string[] = []
  const weaknesses: string[] = []
  const recommendations: string[] = []

  // Analyze crawl results
  if (crawl.title) strengths.push('Má title tag')
  else {
    weaknesses.push('Chybí title tag')
    recommendations.push('Přidejte popisný title tag')
  }

  if (crawl.description) strengths.push('Má meta description')
  else {
    weaknesses.push('Chybí meta description')
    recommendations.push('Přidejte meta description pro lepší SEO')
  }

  if (crawl.h1.length === 1) strengths.push('Správně jeden H1')
  else if (crawl.h1.length === 0) {
    weaknesses.push('Chybí H1 nadpis')
    recommendations.push('Přidejte jeden hlavní H1 nadpis')
  } else {
    weaknesses.push(`Více H1 nadpisů (${crawl.h1.length})`)
    recommendations.push('Použijte pouze jeden H1 nadpis na stránce')
  }

  if (crawl.techStack.length > 0) {
    strengths.push(`Detekovaný stack: ${crawl.techStack.join(', ')}`)
  }

  // Analyze PageSpeed
  if (pageSpeed && !pageSpeed.error) {
    if (pageSpeed.performance >= 90) strengths.push(`Výborný výkon (${pageSpeed.performance}/100)`)
    else if (pageSpeed.performance >= 50) weaknesses.push(`Průměrný výkon (${pageSpeed.performance}/100)`)
    else {
      weaknesses.push(`Špatný výkon (${pageSpeed.performance}/100)`)
      recommendations.push('Optimalizujte rychlost načítání stránky')
    }

    if (pageSpeed.seo >= 90) strengths.push(`Výborné SEO (${pageSpeed.seo}/100)`)
    else if (pageSpeed.seo < 70) {
      weaknesses.push(`Slabé SEO (${pageSpeed.seo}/100)`)
      recommendations.push('Vylepšete on-page SEO faktory')
    }

    if (pageSpeed.accessibility >= 90) strengths.push(`Dobrá přístupnost (${pageSpeed.accessibility}/100)`)
    else if (pageSpeed.accessibility < 70) {
      weaknesses.push(`Slabá přístupnost (${pageSpeed.accessibility}/100)`)
      recommendations.push('Zlepšete přístupnost webu')
    }
  }

  // Calculate overall score
  let overallScore = 50 // Base score

  if (crawl.title) overallScore += 10
  if (crawl.description) overallScore += 10
  if (crawl.h1.length === 1) overallScore += 5

  if (pageSpeed && !pageSpeed.error) {
    overallScore = Math.round((overallScore + pageSpeed.performance + pageSpeed.seo) / 3)
  }

  overallScore = Math.min(100, Math.max(0, overallScore))

  return {
    crawl,
    pageSpeed,
    screenshot,
    summary: {
      overallScore,
      strengths,
      weaknesses,
      recommendations,
    },
  }
}

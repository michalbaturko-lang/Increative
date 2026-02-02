import { NextRequest, NextResponse } from 'next/server'
import { anthropic, AGENT_PROMPTS } from '@/lib/claude'
import { createServerClient } from '@/lib/supabase'
import { analyzeWebsite, WebsiteAnalysis } from '@/lib/web-tools'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID

interface WebsiteFile {
  [path: string]: string
}

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
}

interface GeneratedProject {
  projectName: string
  description: string
  files: WebsiteFile
  chosenDesign?: DesignConcept
}

// Analyze existing website
async function analyzeExistingWebsite(url: string): Promise<WebsiteAnalysis | null> {
  try {
    return await analyzeWebsite(url, {
      includePageSpeed: true,
      includeScreenshot: true,
    })
  } catch (error) {
    console.error('Failed to analyze website:', error)
    return null
  }
}

// Generate 3 design concepts
async function generateDesignConcepts(brief: string, analysis: WebsiteAnalysis | null): Promise<DesignConcept[]> {
  const analysisContext = analysis ? `
ANALÝZA SOUČASNÉHO WEBU:
- URL: ${analysis.crawl.url}
- Title: ${analysis.crawl.title}
- Popis: ${analysis.crawl.description}
- Tech stack: ${analysis.crawl.techStack.join(', ') || 'Neznámý'}
- Silné stránky: ${analysis.summary.strengths.join(', ')}
- Slabé stránky: ${analysis.summary.weaknesses.join(', ')}
${analysis.pageSpeed ? `- Výkon: ${analysis.pageSpeed.performance}/100, SEO: ${analysis.pageSpeed.seo}/100` : ''}
` : ''

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Jsi expert na web design. Vytvoř 3 různé koncepty redesignu webu.

ZADÁNÍ:
${brief}

${analysisContext}

Vytvoř 3 VÝRAZNĚ odlišné návrhy:
1. Moderní minimalistický - čisté, hodně prostoru
2. Odvážný kreativní - výrazné barvy, unikátní layout
3. Profesionální důvěryhodný - konzervativní, čitelný

Odpověz POUZE validním JSON:
{
  "concepts": [
    {
      "name": "Název",
      "style": "minimalist|bold|corporate",
      "description": "2-3 věty",
      "colorScheme": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "text": "#hex"
      },
      "typography": {
        "headingFont": "Google Font",
        "bodyFont": "Google Font"
      },
      "keyFeatures": ["feature1", "feature2", "feature3"]
    }
  ],
  "recommendation": {
    "bestChoice": 0,
    "reason": "Proč je tento nejlepší"
  }
}`,
      },
    ],
  })

  const outputText = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = outputText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return result.concepts || []
    }
  } catch {}

  return []
}

// Generate website code with chosen design
async function generateWebsite(
  brief: string,
  analysis: WebsiteAnalysis | null,
  chosenDesign: DesignConcept | null
): Promise<GeneratedProject> {
  const analysisContext = analysis ? `
ANALÝZA PŮVODNÍHO WEBU:
- Struktura: ${analysis.crawl.h1.join(', ')} (H1), ${analysis.crawl.h2.length} H2 nadpisů
- Obsah: ${analysis.crawl.wordCount} slov
- Meta: ${analysis.crawl.title} | ${analysis.crawl.description}
` : ''

  const designContext = chosenDesign ? `
VYBRANÝ DESIGN:
- Styl: ${chosenDesign.name} (${chosenDesign.style})
- Popis: ${chosenDesign.description}
- Barvy: Primary ${chosenDesign.colorScheme.primary}, Secondary ${chosenDesign.colorScheme.secondary}, Accent ${chosenDesign.colorScheme.accent}
- Fonty: ${chosenDesign.typography.headingFont} (nadpisy), ${chosenDesign.typography.bodyFont} (text)
- Features: ${chosenDesign.keyFeatures.join(', ')}
` : ''

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: AGENT_PROMPTS.web_developer,
    messages: [
      {
        role: 'user',
        content: `Vytvoř kompletní Next.js web podle tohoto zadání:

ZADÁNÍ:
${brief}

${analysisContext}
${designContext}

Vytvoř kompletní Next.js 14 projekt s:
- package.json (dependencies: next, react, react-dom, tailwindcss, @tailwindcss/typography)
- tailwind.config.js (s custom barvami z designu)
- next.config.js
- app/layout.tsx (s Google Fonts)
- app/page.tsx (hlavní stránka)
- app/globals.css
- components/ (potřebné komponenty)

DŮLEŽITÉ: Odpověz POUZE validním JSON bez markdown:
{
  "projectName": "nazev-projektu",
  "description": "Popis projektu",
  "files": {
    "package.json": "obsah souboru",
    "tailwind.config.js": "obsah",
    "app/layout.tsx": "obsah",
    "app/page.tsx": "obsah",
    "app/globals.css": "obsah"
  }
}`,
      },
    ],
  })

  const outputText = response.content[0].type === 'text' ? response.content[0].text : ''

  let jsonStr = outputText
  const jsonMatch = outputText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1]
  }

  // Try to find JSON object
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    jsonStr = objectMatch[0]
  }

  try {
    const project = JSON.parse(jsonStr.trim())
    return {
      ...project,
      chosenDesign,
    }
  } catch {
    throw new Error('Nepodařilo se vygenerovat projekt. Zkuste to znovu.')
  }
}

// Create GitHub repository
async function createGitHubRepo(projectName: string, description: string): Promise<string> {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token není nakonfigurován')
  }

  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: projectName,
      description,
      private: false,
      auto_init: false,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    if (error.errors?.[0]?.message?.includes('already exists')) {
      const userResponse = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
      })
      const user = await userResponse.json()
      return `https://github.com/${user.login}/${projectName}`
    }
    throw new Error(`GitHub: ${error.message || 'Nepodařilo se vytvořit repozitář'}`)
  }

  const repo = await response.json()
  return repo.html_url
}

// Push files to GitHub
async function pushToGitHub(repoUrl: string, files: WebsiteFile): Promise<void> {
  if (!GITHUB_TOKEN) throw new Error('GitHub token není nakonfigurován')

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) throw new Error('Neplatná URL repozitáře')
  const [, owner, repo] = match

  const treeEntries = Object.entries(files).map(([path, content]) => ({
    path,
    mode: '100644' as const,
    type: 'blob' as const,
    content,
  }))

  const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tree: treeEntries }),
  })

  if (!treeResponse.ok) throw new Error('Nepodařilo se vytvořit soubory')

  const tree = await treeResponse.json()

  const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
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

  if (!commitResponse.ok) throw new Error('Nepodařilo se vytvořit commit')

  const commit = await commitResponse.json()

  const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sha: commit.sha, force: true }),
  })

  if (!refResponse.ok) {
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'refs/heads/main', sha: commit.sha }),
    })
  }
}

// Deploy to Vercel
async function deployToVercel(projectName: string, repoUrl: string): Promise<string> {
  if (!VERCEL_TOKEN) throw new Error('Vercel token není nakonfigurován')

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) throw new Error('Neplatná URL')
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
      ...(VERCEL_TEAM_ID && { teamId: VERCEL_TEAM_ID }),
    }),
  })

  if (!projectResponse.ok) {
    const error = await projectResponse.json()
    if (error.error?.code === 'PROJECT_EXISTS') {
      return `https://${projectName}.vercel.app`
    }
    throw new Error(`Vercel: ${error.error?.message || 'Chyba'}`)
  }

  const project = await projectResponse.json()
  return `https://${project.name}.vercel.app`
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  let taskId: string | null = null

  try {
    const body = await request.json()
    const {
      title,
      description,
      clientName,
      existingUrl,
      priority = 'medium',
      selectedDesignIndex,
      mode = 'full' // 'analyze' | 'designs' | 'full'
    } = body

    // STEP 0: Save task
    const { data: newTask, error: dbError } = await supabase.from('tasks').insert({
      type: 'web_development',
      title,
      description,
      status: 'processing',
      priority,
      client_name: clientName || null,
      agent_type: 'web_developer',
      output: 'Analyzuji web...',
      metadata: { existingUrl, mode },
    }).select('id').single()

    if (dbError) {
      return NextResponse.json({
        success: false,
        error: `DB Error: ${dbError.message}`,
      }, { status: 500 })
    }

    taskId = newTask.id

    // STEP 1: Analyze existing website (if URL provided)
    let analysis: WebsiteAnalysis | null = null
    if (existingUrl) {
      await supabase.from('tasks').update({ output: 'Analyzuji existující web...' }).eq('id', taskId)
      analysis = await analyzeExistingWebsite(existingUrl)
    }

    // If mode is 'analyze', return just the analysis
    if (mode === 'analyze') {
      await supabase.from('tasks').update({
        status: 'completed',
        output: JSON.stringify(analysis, null, 2),
        metadata: { existingUrl, analysis },
      }).eq('id', taskId)

      return NextResponse.json({
        success: true,
        mode: 'analyze',
        taskId,
        analysis,
      })
    }

    // STEP 2: Generate 3 design concepts
    await supabase.from('tasks').update({ output: 'Generuji 3 návrhy designu...' }).eq('id', taskId)
    const designConcepts = await generateDesignConcepts(description, analysis)

    // If mode is 'designs', return concepts for user to choose
    if (mode === 'designs') {
      await supabase.from('tasks').update({
        status: 'needs_review',
        output: 'Vyberte jeden z návrhů designu',
        metadata: { existingUrl, analysis, designConcepts },
      }).eq('id', taskId)

      return NextResponse.json({
        success: true,
        mode: 'designs',
        taskId,
        analysis,
        designConcepts,
      })
    }

    // STEP 3: Generate website code
    await supabase.from('tasks').update({ output: 'Generuji kód webu...' }).eq('id', taskId)

    const chosenDesign = designConcepts[selectedDesignIndex ?? 0] || null
    const project = await generateWebsite(description, analysis, chosenDesign)

    const sanitizedName = project.projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)

    let githubUrl = ''
    let vercelUrl = ''

    // STEP 4: Push to GitHub
    if (GITHUB_TOKEN) {
      await supabase.from('tasks').update({ output: 'Vytvářím GitHub repozitář...' }).eq('id', taskId)
      try {
        githubUrl = await createGitHubRepo(sanitizedName, project.description)
        await pushToGitHub(githubUrl, project.files)
      } catch (error) {
        console.error('GitHub error:', error)
      }
    }

    // STEP 5: Deploy to Vercel
    if (VERCEL_TOKEN && githubUrl) {
      await supabase.from('tasks').update({ output: 'Deployuji na Vercel...' }).eq('id', taskId)
      try {
        vercelUrl = await deployToVercel(sanitizedName, githubUrl)
      } catch (error) {
        console.error('Vercel error:', error)
      }
    }

    // Build output
    const output = `# ${project.projectName}

${project.description}

## Analýza původního webu
${analysis ? `- Skóre: ${analysis.summary.overallScore}/100
- Silné stránky: ${analysis.summary.strengths.join(', ')}
- Slabé stránky: ${analysis.summary.weaknesses.join(', ')}` : 'Nebyla provedena'}

## Vybraný design
${chosenDesign ? `- **${chosenDesign.name}** (${chosenDesign.style})
- ${chosenDesign.description}
- Barvy: ${chosenDesign.colorScheme.primary}, ${chosenDesign.colorScheme.secondary}` : 'Výchozí design'}

## Odkazy
${githubUrl ? `- **GitHub**: ${githubUrl}` : '- GitHub: Nenastaveno'}
${vercelUrl ? `- **Web**: ${vercelUrl}` : '- Vercel: Nenastaveno'}

## Soubory
${Object.keys(project.files).map(f => `- \`${f}\``).join('\n')}`

    const finalStatus = vercelUrl ? 'completed' : 'needs_review'

    await supabase.from('tasks').update({
      status: finalStatus,
      output,
      metadata: {
        projectName: project.projectName,
        githubUrl,
        vercelUrl,
        files: Object.keys(project.files),
        analysis: analysis?.summary,
        chosenDesign,
        allDesigns: designConcepts,
      },
    }).eq('id', taskId)

    return NextResponse.json({
      success: true,
      status: finalStatus,
      taskId,
      projectName: project.projectName,
      analysis: analysis?.summary,
      designConcepts,
      chosenDesign,
      githubUrl,
      vercelUrl,
      output,
      files: project.files,
    })
  } catch (error) {
    console.error('Web Developer API Error:', error)

    if (taskId) {
      await supabase.from('tasks').update({
        status: 'failed',
        output: `Chyba: ${error instanceof Error ? error.message : 'Neznámá chyba'}`,
      }).eq('id', taskId)
    }

    return NextResponse.json({
      success: false,
      taskId,
      error: error instanceof Error ? error.message : 'Neznámá chyba',
    }, { status: 500 })
  }
}

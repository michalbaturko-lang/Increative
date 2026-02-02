'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Globe, Palette, FileCode, Rocket, MessageSquare, Check, RefreshCw } from 'lucide-react'
import Link from 'next/link'

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
  moodKeywords?: string[]
}

interface ProjectBrief {
  url?: string
  clientName: string
  description: string
  features: string[]
  style?: string
  mood?: string[]
}

interface BlogArticle {
  title: string
  slug: string
}

type Step = 'brief' | 'analyzing' | 'design' | 'generating' | 'review' | 'deploying' | 'complete'

export default function NewWebProjectPage() {
  const [step, setStep] = useState<Step>('brief')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [clientName, setClientName] = useState('')
  const [briefText, setBriefText] = useState('')

  // Project data
  const [projectId, setProjectId] = useState<string | null>(null)
  const [brief, setBrief] = useState<ProjectBrief | null>(null)
  const [analysis, setAnalysis] = useState<{ overallScore?: number; strengths?: string[]; weaknesses?: string[] } | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [designConcepts, setDesignConcepts] = useState<DesignConcept[]>([])
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null)
  const [chosenDesign, setChosenDesign] = useState<DesignConcept | null>(null)
  const [sections, setSections] = useState<{ name: string; description: string }[]>([])
  const [blogArticles, setBlogArticles] = useState<BlogArticle[]>([])
  const [files, setFiles] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState('')
  const [githubUrl, setGithubUrl] = useState<string | null>(null)
  const [vercelUrl, setVercelUrl] = useState<string | null>(null)

  // Step 1: Submit brief
  const handleSubmitBrief = async () => {
    if (!briefText.trim()) {
      setError('Zadejte popis projektu')
      return
    }

    setLoading(true)
    setError(null)
    setStep('analyzing')

    try {
      const response = await fetch('/api/projects/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          clientName: clientName || 'Nový klient',
          brief: briefText,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Nepodařilo se analyzovat zadání')
      }

      setProjectId(data.projectId)
      setBrief(data.brief)
      setAnalysis(data.analysis)
      setScreenshot(data.screenshot)
      setDesignConcepts(data.designConcepts || [])
      setStep('design')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
      setStep('brief')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Select design
  const handleSelectDesign = async () => {
    if (selectedDesign === null) {
      setError('Vyberte design')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select_design',
          projectId,
          designIndex: selectedDesign,
          designConcepts,
          brief,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Nepodařilo se vybrat design')
      }

      setChosenDesign(data.chosenDesign)
      setSections(data.sections || [])

      // Automatically start generating
      await handleGenerate(data.chosenDesign, data.sections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Generate content
  const handleGenerate = async (design?: DesignConcept, sects?: { name: string; description: string }[]) => {
    setStep('generating')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          projectId,
          brief,
          chosenDesign: design || chosenDesign,
          sections: sects || sections,
          generateArticles: true,
          articleCount: 10,
          generateImages: false, // TODO: Enable when Meshy is ready
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Nepodařilo se vygenerovat obsah')
      }

      setBlogArticles(data.blogArticles || [])
      setFiles(data.fullFiles || {})
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
      setStep('design')
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Revise based on feedback
  const handleRevise = async () => {
    if (!feedback.trim()) {
      setError('Zadejte feedback')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revise',
          projectId,
          feedback,
          files,
          chosenDesign,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Nepodařilo se aplikovat změny')
      }

      setFiles(data.fullFiles || {})
      setFeedback('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
    } finally {
      setLoading(false)
    }
  }

  // Step 5: Deploy
  const handleDeploy = async () => {
    setStep('deploying')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deploy',
          projectId,
          files,
          brief,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Nepodařilo se deployovat')
      }

      setGithubUrl(data.githubUrl)
      setVercelUrl(data.vercelUrl)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
      setStep('review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold">Nový webový projekt</h1>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mt-4 text-sm">
            {[
              { key: 'brief', label: 'Zadání', icon: FileCode },
              { key: 'design', label: 'Design', icon: Palette },
              { key: 'review', label: 'Review', icon: MessageSquare },
              { key: 'complete', label: 'Deploy', icon: Rocket },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                {i > 0 && <div className="w-8 h-px bg-gray-700 mx-2" />}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  step === s.key || (step === 'analyzing' && s.key === 'brief') || (step === 'generating' && s.key === 'design') || (step === 'deploying' && s.key === 'complete')
                    ? 'bg-blue-600 text-white'
                    : ['complete'].includes(step) && ['brief', 'design', 'review'].includes(s.key)
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-gray-800 text-gray-400'
                }`}>
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Step: Brief */}
        {(step === 'brief' || step === 'analyzing') && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Název klienta
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="např. Kvalitní Základy s.r.o."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Popis projektu (brief)
              </label>
              <textarea
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                placeholder="Popište co potřebujete... např:

Máme klienta s webem https://kvalitni-zaklady.cz/ a potřebuji mu ten web redesignovat. Přidej responzivitu, 10 blogových článků na témata stavebních základů. K tomu sekce Aktuální projekt s okomentovanými fotkami. Web bude tmavý, moderní a interaktivní."
                rows={8}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleSubmitBrief}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzuji zadání...
                </>
              ) : (
                <>
                  Analyzovat a navrhnout design
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step: Design Selection */}
        {step === 'design' && (
          <div className="space-y-6">
            {/* Analysis summary */}
            {analysis && (
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Analýza webu
                </h3>
                {screenshot && (
                  <img src={screenshot} alt="Screenshot" className="w-full max-w-md rounded-lg mb-3" />
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Skóre:</span>{' '}
                    <span className="text-white font-medium">{analysis.overallScore}/100</span>
                  </div>
                  {analysis.strengths && analysis.strengths.length > 0 && (
                    <div>
                      <span className="text-gray-400">Silné stránky:</span>{' '}
                      <span className="text-green-400">{analysis.strengths.join(', ')}</span>
                    </div>
                  )}
                  {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-400">K vylepšení:</span>{' '}
                      <span className="text-yellow-400">{analysis.weaknesses.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Design concepts */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Vyberte design</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {designConcepts.map((concept, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedDesign(index)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDesign === index
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    {/* Color preview */}
                    <div className="flex gap-1 mb-3">
                      {Object.entries(concept.colorScheme).map(([key, color]) => (
                        <div
                          key={key}
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: color }}
                          title={key}
                        />
                      ))}
                    </div>

                    <h3 className="font-semibold text-white">{concept.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{concept.description}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {concept.keyFeatures?.slice(0, 3).map((feature, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Fonty: {concept.typography.headingFont}, {concept.typography.bodyFont}
                    </div>

                    {selectedDesign === index && (
                      <div className="mt-3 flex items-center gap-1 text-blue-400 text-sm">
                        <Check className="w-4 h-4" />
                        Vybráno
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSelectDesign}
              disabled={loading || selectedDesign === null}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generuji obsah...
                </>
              ) : (
                <>
                  Vybrat a generovat web
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step: Generating */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Generuji web</h2>
            <p className="text-gray-400">Vytvářím blogové články, strukturu a kód...</p>
            <p className="text-gray-500 text-sm mt-2">Může to trvat 1-2 minuty</p>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-300 mb-2">Design</h3>
                <p className="text-white font-semibold">{chosenDesign?.name}</p>
                <p className="text-sm text-gray-400">{chosenDesign?.style}</p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-300 mb-2">Blogové články</h3>
                <p className="text-white font-semibold">{blogArticles.length} článků</p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-300 mb-2">Soubory</h3>
                <p className="text-white font-semibold">{Object.keys(files).length} souborů</p>
              </div>
            </div>

            {/* Blog articles list */}
            {blogArticles.length > 0 && (
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium mb-3">Vygenerované články</h3>
                <div className="space-y-1 text-sm">
                  {blogArticles.map((article, i) => (
                    <div key={i} className="text-gray-300">
                      {i + 1}. {article.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files list */}
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <h3 className="font-medium mb-3">Vygenerované soubory</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.keys(files).map((file) => (
                  <div key={file} className="text-gray-400 font-mono text-xs">
                    {file}
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback section */}
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-yellow-400" />
                Feedback (volitelné)
              </h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Co byste chtěli změnit? např. Změň barvu tlačítek na oranžovou, přidej více animací..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-sm"
                disabled={loading}
              />
              <button
                onClick={handleRevise}
                disabled={loading || !feedback.trim()}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aplikuji změny...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Přepracovat
                  </>
                )}
              </button>
            </div>

            {/* Deploy button */}
            <button
              onClick={handleDeploy}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Deployuji...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Deployovat na Vercel
                </>
              )}
            </button>
          </div>
        )}

        {/* Step: Deploying */}
        {step === 'deploying' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Deployuji web</h2>
            <p className="text-gray-400">Vytvářím GitHub repo a spouštím Vercel deployment...</p>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Web úspěšně vytvořen!</h2>
            <p className="text-gray-400 mb-8">Váš web je připraven</p>

            <div className="flex flex-col gap-4 max-w-md mx-auto">
              {vercelUrl && (
                <a
                  href={vercelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  Otevřít web: {vercelUrl}
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  GitHub repozitář
                </a>
              )}
              <Link
                href="/projects/web/new"
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Vytvořit další projekt
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

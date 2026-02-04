'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Loader2, Globe, Palette, FileCode, Rocket, MessageSquare, Check, RefreshCw, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react'
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
}

interface LogEntry {
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  timestamp: string
}

interface StepStatus {
  step: string
  status: 'pending' | 'running' | 'completed' | 'error'
  details?: string
}

interface BlogArticle {
  title: string
  slug: string
}

type Phase = 'input' | 'generating' | 'design_selection' | 'review' | 'deploying' | 'complete'

const STEPS = [
  { id: 'parse_brief', label: 'Analýza zadání' },
  { id: 'analyze_website', label: 'Analýza webu' },
  { id: 'generate_designs', label: 'Generování designů' },
  { id: 'plan_sections', label: 'Plánování struktury' },
  { id: 'generate_articles', label: 'Generování článků' },
  { id: 'generate_code', label: 'Generování kódu' },
  { id: 'supervisor_review', label: 'Kontrola supervisorem' },
]

export default function NewWebProjectPage() {
  const [phase, setPhase] = useState<Phase>('input')
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [clientName, setClientName] = useState('')
  const [briefText, setBriefText] = useState('')

  // Progress tracking
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [steps, setSteps] = useState<Record<string, StepStatus>>({})
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Generated data
  const [designConcepts, setDesignConcepts] = useState<DesignConcept[]>([])
  const [selectedDesign, setSelectedDesign] = useState<number>(0)
  const [chosenDesign, setChosenDesign] = useState<DesignConcept | null>(null)
  const [blogArticles, setBlogArticles] = useState<BlogArticle[]>([])
  const [files, setFiles] = useState<Record<string, string>>({})
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [githubUrl, setGithubUrl] = useState<string | null>(null)
  const [vercelUrl, setVercelUrl] = useState<string | null>(null)
  const [isRevising, setIsRevising] = useState(false)

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Start generation with streaming
  const handleStartGeneration = async () => {
    if (!briefText.trim()) {
      setError('Zadejte popis projektu')
      return
    }

    setError(null)
    setPhase('generating')
    setLogs([])
    setSteps({})

    const params = new URLSearchParams({
      brief: briefText,
      clientName: clientName || 'Nový klient',
      designIndex: '0',
      articleCount: '10',
    })

    try {
      const response = await fetch(`/api/projects/web/stream?${params}`)

      if (!response.ok) {
        throw new Error('Nepodařilo se spustit generování')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Stream není dostupný')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6))
              handleStreamEvent(currentEvent, data)
            } catch (e) {
              console.error('Failed to parse event data:', e)
            }
            currentEvent = ''
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
      setPhase('input')
    }
  }

  // Handle stream events
  const handleStreamEvent = (event: string, data: unknown) => {
    switch (event) {
      case 'log':
        const logData = data as LogEntry
        setLogs(prev => [...prev, logData])
        break

      case 'step':
        const stepData = data as StepStatus
        setSteps(prev => ({ ...prev, [stepData.step]: stepData }))
        break

      case 'brief':
        // Brief parsed
        break

      case 'analysis':
        const analysisData = data as { screenshot?: string }
        if (analysisData.screenshot) {
          setScreenshot(analysisData.screenshot)
        }
        break

      case 'designs':
        setDesignConcepts(data as DesignConcept[])
        break

      case 'sections':
        // Sections planned
        break

      case 'articles':
        setBlogArticles(data as BlogArticle[])
        break

      case 'files':
        const filesData = data as { files: Record<string, string> }
        setFiles(filesData.files)
        break

      case 'complete':
        const completeData = data as {
          chosenDesign: DesignConcept
          files: Record<string, string>
          blogArticles: BlogArticle[]
        }
        setChosenDesign(completeData.chosenDesign)
        setFiles(completeData.files)
        setPhase('review')
        break

      case 'error':
        const errorData = data as { message: string }
        setError(errorData.message)
        setPhase('input')
        break
    }
  }

  // Revise based on feedback
  const handleRevise = async () => {
    if (!feedback.trim()) {
      setError('Zadejte feedback')
      return
    }

    setIsRevising(true)
    setError(null)

    try {
      const response = await fetch('/api/projects/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revise',
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
      setLogs(prev => [...prev, {
        message: 'Změny aplikovány',
        type: 'success',
        timestamp: new Date().toISOString()
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
    } finally {
      setIsRevising(false)
    }
  }

  // Deploy
  const handleDeploy = async () => {
    setPhase('deploying')
    setLogs(prev => [...prev, {
      message: 'Spouštím deployment...',
      type: 'info',
      timestamp: new Date().toISOString()
    }])

    try {
      const response = await fetch('/api/projects/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deploy',
          files,
          brief: { clientName },
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Nepodařilo se deployovat')
      }

      setGithubUrl(data.githubUrl)
      setVercelUrl(data.vercelUrl)
      setPhase('complete')

      setLogs(prev => [...prev, {
        message: `Deployováno na ${data.vercelUrl || data.githubUrl}`,
        type: 'success',
        timestamp: new Date().toISOString()
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
      setPhase('review')
    }
  }

  // Render step icon
  const renderStepIcon = (stepId: string) => {
    const stepStatus = steps[stepId]

    if (!stepStatus || stepStatus.status === 'pending') {
      return <Circle className="w-5 h-5 text-gray-600" />
    }

    switch (stepStatus.status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Circle className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold">Nový webový projekt</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input phase */}
            {phase === 'input' && (
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Popis projektu (brief)
                  </label>
                  <textarea
                    value={briefText}
                    onChange={(e) => setBriefText(e.target.value)}
                    placeholder={`Popište co potřebujete... např:

Máme klienta s webem https://kvalitni-zaklady.cz/ a potřebuji mu ten web redesignovat. Přidej responzivitu, 10 blogových článků na témata stavebních základů. K tomu sekce Aktuální projekt s okomentovanými fotkami. Web bude tmavý, moderní a interaktivní.`}
                    rows={10}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  onClick={handleStartGeneration}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                  <Rocket className="w-5 h-5" />
                  Spustit generování
                </button>
              </div>
            )}

            {/* Generating / Review phase - show logs */}
            {(phase === 'generating' || phase === 'review' || phase === 'deploying' || phase === 'complete') && (
              <div className="space-y-6">
                {/* Logs panel */}
                <div className="bg-gray-900 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <h3 className="font-medium flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-blue-400" />
                      Průběh generování
                    </h3>
                    {phase === 'generating' && (
                      <span className="flex items-center gap-2 text-sm text-blue-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Probíhá...
                      </span>
                    )}
                    {phase === 'review' && (
                      <span className="flex items-center gap-2 text-sm text-green-400">
                        <Check className="w-4 h-4" />
                        Dokončeno
                      </span>
                    )}
                  </div>

                  <div className="h-80 overflow-y-auto p-4 font-mono text-sm space-y-1">
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 ${
                          log.type === 'success' ? 'text-green-400' :
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'warning' ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}
                      >
                        <span className="text-gray-600 text-xs mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString('cs-CZ')}
                        </span>
                        <span>{log.type === 'success' ? '✓' : log.type === 'error' ? '✗' : '→'}</span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </div>

                {/* Review section */}
                {phase === 'review' && (
                  <>
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-400">{Object.keys(files).length}</div>
                        <p className="text-sm text-gray-400">Souborů</p>
                      </div>
                      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-400">{blogArticles.length}</div>
                        <p className="text-sm text-gray-400">Článků</p>
                      </div>
                      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-400">{chosenDesign?.name || '-'}</div>
                        <p className="text-sm text-gray-400">Design</p>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-yellow-400" />
                        Feedback (volitelné)
                      </h3>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Co byste chtěli změnit? např. Změň barvu tlačítek, přidej více animací..."
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-sm resize-none"
                        disabled={isRevising}
                      />
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={handleRevise}
                          disabled={isRevising || !feedback.trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
                        >
                          {isRevising ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Upravuji...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Přepracovat
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDeploy}
                          disabled={isRevising}
                          className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg text-sm font-medium"
                        >
                          <Rocket className="w-4 h-4" />
                          Deployovat
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Complete */}
                {phase === 'complete' && (
                  <div className="p-6 bg-gray-900 border border-green-700 rounded-lg text-center">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-semibold mb-4">Web úspěšně vytvořen!</h2>
                    <div className="flex flex-col gap-3 max-w-md mx-auto">
                      {vercelUrl && (
                        <a
                          href={vercelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                        >
                          <Globe className="w-5 h-5" />
                          Otevřít web
                        </a>
                      )}
                      {githubUrl && (
                        <a
                          href={githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                        >
                          GitHub repozitář
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Steps */}
          <div className="space-y-6">
            {/* Steps panel */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Kroky
              </h3>
              <div className="space-y-3">
                {STEPS.map((step) => {
                  const stepStatus = steps[step.id]
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        stepStatus?.status === 'running' ? 'bg-blue-900/30' :
                        stepStatus?.status === 'completed' ? 'bg-green-900/20' :
                        stepStatus?.status === 'error' ? 'bg-red-900/20' :
                        ''
                      }`}
                    >
                      {renderStepIcon(step.id)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          stepStatus?.status === 'completed' ? 'text-green-400' :
                          stepStatus?.status === 'running' ? 'text-blue-400' :
                          stepStatus?.status === 'error' ? 'text-red-400' :
                          'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                        {stepStatus?.details && (
                          <p className="text-xs text-gray-500 truncate">
                            {stepStatus.details}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Screenshot */}
            {screenshot && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-3">Aktuální web</h3>
                <img
                  src={screenshot}
                  alt="Screenshot"
                  className="w-full rounded-lg"
                />
              </div>
            )}

            {/* Design preview */}
            {chosenDesign && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-400" />
                  Vybraný design
                </h3>
                <p className="text-sm text-white font-medium">{chosenDesign.name}</p>
                <p className="text-xs text-gray-400 mb-3">{chosenDesign.style}</p>
                <div className="flex gap-1">
                  {Object.values(chosenDesign.colorScheme).map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Articles preview */}
            {blogArticles.length > 0 && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-3">Vygenerované články</h3>
                <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                  {blogArticles.map((article, i) => (
                    <div key={i} className="text-gray-400 truncate">
                      {i + 1}. {article.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

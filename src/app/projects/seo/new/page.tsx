'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Search, FileText, BarChart3, Target, Users, Check, RefreshCw, Download, Copy } from 'lucide-react'
import Link from 'next/link'

interface TechnicalAudit {
  score: number
  issues: {
    critical: { type: string; description: string }[]
    warning: { type: string; description: string }[]
    info: { type: string; description: string }[]
  }
}

interface OnPageAudit {
  score: number
  title: { current: string; issues: string[] }
  metaDescription: { current: string; issues: string[] }
}

interface KeywordAnalysis {
  keyword: string
  opportunity: string
  suggestedContent?: string
}

interface Recommendation {
  priority: string
  category: string
  title: string
  description: string
}

type Step = 'brief' | 'analyzing' | 'auditing' | 'analyzing_keywords' | 'report' | 'complete'

export default function NewSEOProjectPage() {
  const [step, setStep] = useState<Step>('brief')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [clientName, setClientName] = useState('')
  const [briefText, setBriefText] = useState('')
  const [useFullAudit, setUseFullAudit] = useState(true)

  // Project data
  const [projectId, setProjectId] = useState<string | null>(null)
  const [brief, setBrief] = useState<{ url: string; clientName: string } | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [technicalAudit, setTechnicalAudit] = useState<TechnicalAudit | null>(null)
  const [onPageAudit, setOnPageAudit] = useState<OnPageAudit | null>(null)
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [fullReport, setFullReport] = useState<string>('')
  const [feedback, setFeedback] = useState('')

  // Run full audit
  const handleFullAudit = async () => {
    if (!briefText.trim()) {
      setError('Zadejte URL webu k analýze')
      return
    }

    setLoading(true)
    setError(null)
    setStep('analyzing')

    try {
      const response = await fetch('/api/projects/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'full',
          clientName: clientName || 'Nový klient',
          brief: briefText,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Nepodařilo se provést audit')
      }

      setProjectId(data.projectId)
      setBrief(data.brief)
      setScreenshot(data.screenshot)
      setTechnicalAudit(data.technicalAudit)
      setOnPageAudit(data.onPageAudit)
      setKeywordAnalysis(data.keywordAnalysis || [])
      setRecommendations(data.recommendations || [])
      setFullReport(data.fullReport || '')
      setStep('report')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
      setStep('brief')
    } finally {
      setLoading(false)
    }
  }

  // Revise report
  const handleRevise = async () => {
    if (!feedback.trim()) {
      setError('Zadejte feedback')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revise',
          projectId,
          feedback,
          fullReport,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Nepodařilo se upravit report')
      }

      setFullReport(data.fullReport)
      setFeedback('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba')
    } finally {
      setLoading(false)
    }
  }

  // Copy report to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullReport)
      alert('Report zkopírován do schránky')
    } catch {
      alert('Nepodařilo se zkopírovat')
    }
  }

  // Download report as markdown
  const handleDownload = () => {
    const blob = new Blob([fullReport], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-audit-${brief?.clientName || 'report'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const overallScore = technicalAudit && onPageAudit
    ? Math.round((technicalAudit.score + onPageAudit.score) / 2)
    : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold">Nový SEO Audit</h1>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mt-4 text-sm">
            {[
              { key: 'brief', label: 'Zadání', icon: FileText },
              { key: 'analyzing', label: 'Analýza', icon: Search },
              { key: 'report', label: 'Report', icon: BarChart3 },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center">
                {i > 0 && <div className="w-8 h-px bg-gray-700 mx-2" />}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  step === s.key || (step === 'auditing' && s.key === 'analyzing') || (step === 'analyzing_keywords' && s.key === 'analyzing') || (step === 'complete' && s.key === 'report')
                    ? 'bg-orange-600 text-white'
                    : step === 'report' && s.key === 'brief'
                      ? 'bg-green-600/20 text-green-400'
                      : step === 'report' && s.key === 'analyzing'
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
        {step === 'brief' && (
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
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL webu a požadavky
              </label>
              <textarea
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                placeholder="Zadejte URL webu a případně další požadavky... např:

https://kvalitni-zaklady.cz/

Konkurenti: firma1.cz, firma2.cz
Klíčová slova: stavební základy, betonování, základové desky
Cíl: Zlepšit pozici v Google pro oblast Praha"
                rows={8}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleFullAudit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Spouštím audit...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Spustit kompletní SEO audit
                </>
              )}
            </button>

            <p className="text-sm text-gray-500">
              Kompletní audit zahrnuje: technické SEO, on-page analýzu, klíčová slova, konkurenci a doporučení.
              Může trvat 2-3 minuty.
            </p>
          </div>
        )}

        {/* Step: Analyzing */}
        {(step === 'analyzing' || step === 'auditing' || step === 'analyzing_keywords') && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {step === 'analyzing' && 'Analyzuji web...'}
              {step === 'auditing' && 'Provádím SEO audit...'}
              {step === 'analyzing_keywords' && 'Analyzuji klíčová slova...'}
            </h2>
            <p className="text-gray-400">
              {step === 'analyzing' && 'Crawluji stránky, kontroluji PageSpeed...'}
              {step === 'auditing' && 'Technické SEO, on-page faktory...'}
              {step === 'analyzing_keywords' && 'Klíčová slova, konkurence, příležitosti...'}
            </p>
            <p className="text-gray-500 text-sm mt-2">Může to trvat 2-3 minuty</p>
          </div>
        )}

        {/* Step: Report */}
        {step === 'report' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
                <div className={`text-3xl font-bold ${
                  overallScore >= 70 ? 'text-green-400' :
                  overallScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {overallScore}/100
                </div>
                <p className="text-sm text-gray-400 mt-1">Celkové skóre</p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {technicalAudit?.score || 0}/100
                </div>
                <p className="text-sm text-gray-400 mt-1">Technické SEO</p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {onPageAudit?.score || 0}/100
                </div>
                <p className="text-sm text-gray-400 mt-1">On-page SEO</p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length}
                </div>
                <p className="text-sm text-gray-400 mt-1">Prioritních doporučení</p>
              </div>
            </div>

            {/* Screenshot */}
            {screenshot && (
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium mb-3">Screenshot webu</h3>
                <img src={screenshot} alt="Website screenshot" className="rounded-lg max-w-md" />
              </div>
            )}

            {/* Critical issues */}
            {technicalAudit && technicalAudit.issues.critical.length > 0 && (
              <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <h3 className="font-medium text-red-400 mb-3 flex items-center gap-2">
                  ⚠️ Kritické problémy ({technicalAudit.issues.critical.length})
                </h3>
                <div className="space-y-2">
                  {technicalAudit.issues.critical.map((issue, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-red-300">{issue.type}:</span>{' '}
                      <span className="text-gray-300">{issue.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {keywordAnalysis.length > 0 && (
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Top klíčová slova
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {keywordAnalysis.slice(0, 6).map((kw, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-sm">{kw.keyword}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        kw.opportunity === 'high' ? 'bg-green-600' :
                        kw.opportunity === 'medium' ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}>
                        {kw.opportunity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations preview */}
            {recommendations.length > 0 && (
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="font-medium mb-3">Top doporučení</h3>
                <div className="space-y-2">
                  {recommendations.slice(0, 5).map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-gray-800 rounded">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        rec.priority === 'critical' ? 'bg-red-600' :
                        rec.priority === 'high' ? 'bg-orange-600' :
                        rec.priority === 'medium' ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}>
                        {rec.priority}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{rec.title}</p>
                        <p className="text-xs text-gray-400">{rec.description.substring(0, 100)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full report */}
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Kompletní report</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Kopírovat
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Stáhnout .md
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto bg-gray-800 rounded p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {fullReport}
                </pre>
              </div>
            </div>

            {/* Feedback section */}
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-yellow-400" />
                Upravit report
              </h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Co byste chtěli změnit nebo doplnit? např. Přidej více detailů k technickému SEO..."
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
                    Upravuji...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Přepracovat report
                  </>
                )}
              </button>
            </div>

            {/* Done button */}
            <div className="flex gap-4">
              <Link
                href="/projects/seo/new"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Nový audit
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
              >
                <Check className="w-5 h-5" />
                Hotovo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import * as React from 'react'
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Play,
  Clock,
  Brain,
  FileText,
  Search,
  Megaphone,
  Instagram,
  Mail,
  BarChart3,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface AgentResult {
  agentType: string
  title: string
  status: 'success' | 'error' | 'timeout'
  output: string
  duration: number
  error?: string
}

interface DiagnosticsResult {
  id: string
  startedAt: string
  completedAt: string
  agentResults: AgentResult[]
  supervisorEvaluation: string
  overallStatus: 'healthy' | 'warning' | 'critical'
  output: string
}

const agentIcons: Record<string, React.ReactNode> = {
  content_writer: <FileText className="h-4 w-4" />,
  seo_analyst: <Search className="h-4 w-4" />,
  ads_specialist: <Megaphone className="h-4 w-4" />,
  social_media: <Instagram className="h-4 w-4" />,
  email_marketing: <Mail className="h-4 w-4" />,
  analyst: <BarChart3 className="h-4 w-4" />,
}

const agentNames: Record<string, string> = {
  content_writer: 'Content Writer',
  seo_analyst: 'SEO Analyst',
  ads_specialist: 'Ads Specialist',
  social_media: 'Social Media',
  email_marketing: 'Email Marketing',
  analyst: 'Analyst',
}

export default function DiagnosticsPage() {
  const [isRunning, setIsRunning] = React.useState(false)
  const [result, setResult] = React.useState<DiagnosticsResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [currentStep, setCurrentStep] = React.useState('')
  const [expandedAgent, setExpandedAgent] = React.useState<string | null>(null)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)
    setCurrentStep('Spouštím diagnostiku...')

    try {
      const response = await fetch('/api/diagnostics', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          id: data.id,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          agentResults: data.agentResults,
          supervisorEvaluation: data.supervisorEvaluation,
          overallStatus: data.overallStatus,
          output: data.output,
        })
      } else {
        setError(data.error || 'Diagnostika selhala')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neočekávaná chyba')
    } finally {
      setIsRunning(false)
      setCurrentStep('')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-6 w-6 text-emerald-400" />
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-amber-400" />
      case 'critical':
        return <XCircle className="h-6 w-6 text-red-400" />
      default:
        return <Activity className="h-6 w-6 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-white/10 text-muted-foreground border-white/10'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Systém je zdravý - všichni agenti fungují správně'
      case 'warning':
        return 'Systém má varování - některé problémy byly detekovány'
      case 'critical':
        return 'Kritické problémy - vyžaduje okamžitou pozornost'
      default:
        return 'Stav neznámý'
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Diagnostika" subtitle="Testování a hodnocení všech agentů" />

      <main className="flex-1 p-6 space-y-6">
        {/* Run Diagnostics Section */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Systémová diagnostika</h2>
                <p className="text-sm text-muted-foreground">
                  Supervisor otestuje všechny agenty a zhodnotí kvalitu výstupů
                </p>
              </div>
            </div>
            <Button
              onClick={runDiagnostics}
              disabled={isRunning}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-violet-500"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Probíhá diagnostika...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Spustit diagnostiku
                </>
              )}
            </Button>
          </div>

          {/* Running State */}
          {isRunning && (
            <div className="mt-6 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-violet-400 animate-pulse" />
                <span className="text-sm">Testuji agenty a hodnotím výstupy... Trvá to cca 30-60 sekund.</span>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-400" />
              <div>
                <h3 className="font-semibold text-red-400">Chyba diagnostiky</h3>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Overall Status Card */}
            <div className={cn('rounded-xl border p-6', getStatusColor(result.overallStatus))}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(result.overallStatus)}
                  <div>
                    <h3 className="text-xl font-bold">{getStatusText(result.overallStatus)}</h3>
                    <p className="text-sm opacity-80 mt-1">
                      Dokončeno: {new Date(result.completedAt).toLocaleString('cs-CZ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      {Math.round(
                        (new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()) / 1000
                      )}s celkem
                    </span>
                  </div>
                  <p className="text-sm opacity-70 mt-1">
                    {result.agentResults.filter(r => r.status === 'success').length}/{result.agentResults.length} agentů OK
                  </p>
                </div>
              </div>
            </div>

            {/* Agent Results */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Výsledky testů agentů</h3>
              <div className="space-y-3">
                {result.agentResults.map((agentResult) => (
                  <div
                    key={agentResult.agentType}
                    className={cn(
                      'rounded-xl border overflow-hidden transition-all',
                      agentResult.status === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-red-500/30 bg-red-500/5'
                    )}
                  >
                    {/* Agent Header - Clickable */}
                    <button
                      onClick={() => setExpandedAgent(
                        expandedAgent === agentResult.agentType ? null : agentResult.agentType
                      )}
                      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            agentResult.status === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                          )}
                        >
                          {agentIcons[agentResult.agentType] || <Activity className="h-4 w-4" />}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">
                            {agentNames[agentResult.agentType] || agentResult.agentType}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {agentResult.status === 'success' ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-400" />
                            )}
                            <span>{agentResult.status === 'success' ? 'OK' : 'Chyba'}</span>
                            <span>•</span>
                            <span>{agentResult.duration}ms</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-muted-foreground">
                        {expandedAgent === agentResult.agentType ? '▼' : '▶'}
                      </div>
                    </button>

                    {/* Agent Output - Expandable */}
                    {expandedAgent === agentResult.agentType && (
                      <div className="border-t border-white/10 p-4 bg-black/20">
                        <p className="text-xs font-medium text-muted-foreground mb-2">VÝSTUP AGENTA:</p>
                        {agentResult.status === 'success' ? (
                          <pre className="text-sm whitespace-pre-wrap font-sans">{agentResult.output}</pre>
                        ) : (
                          <p className="text-sm text-red-400">{agentResult.error || 'Neznámá chyba'}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Supervisor Evaluation */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Hodnocení od Supervisora</h3>
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
                    <Brain className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-violet-300">Supervisor</p>
                    <p className="text-sm text-muted-foreground">Senior marketingový konzultant</p>
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{result.supervisorEvaluation}</pre>
                </div>
              </div>
            </div>

            {/* Full Report */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Kompletní report</h3>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 max-h-[500px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans">{result.output}</pre>
              </div>
            </div>
          </div>
        )}

        {/* No Results Yet */}
        {!isRunning && !result && !error && (
          <div className="rounded-xl border border-dashed border-white/20 p-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Připraveno k diagnostice</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Klikni na tlačítko výše pro spuštění kompletní diagnostiky.
              Supervisor otestuje všechny agenty a poskytne detailní hodnocení jejich výstupů.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

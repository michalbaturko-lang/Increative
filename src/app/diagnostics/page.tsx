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
  status: 'success' | 'error' | 'timeout'
  duration: number
  error?: string
}

interface DiagnosticsData {
  id: string
  status: string
  output: string
  created_at: string
  metadata?: {
    startedAt?: string
    completedAt?: string
    overallStatus?: 'healthy' | 'warning' | 'critical'
    agentResults?: AgentResult[]
  }
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
  const [lastDiagnostics, setLastDiagnostics] = React.useState<DiagnosticsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [currentStep, setCurrentStep] = React.useState('')

  // Fetch last diagnostics on mount
  React.useEffect(() => {
    fetchLastDiagnostics()
  }, [])

  const fetchLastDiagnostics = async () => {
    try {
      const response = await fetch('/api/diagnostics')
      const data = await response.json()
      if (data.success && data.lastDiagnostics) {
        setLastDiagnostics(data.lastDiagnostics)
      }
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    setCurrentStep('Spouštím diagnostiku...')

    try {
      // Simulate progress updates
      const steps = [
        'Připravuji testovací úkoly...',
        'Testuji Content Writer...',
        'Testuji SEO Analyst...',
        'Testuji Ads Specialist...',
        'Testuji Social Media...',
        'Testuji Email Marketing...',
        'Testuji Analyst...',
        'Supervisor hodnotí výstupy...',
      ]

      let stepIndex = 0
      const stepInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex])
          stepIndex++
        }
      }, 3000)

      const response = await fetch('/api/diagnostics', {
        method: 'POST',
      })

      clearInterval(stepInterval)

      const data = await response.json()

      if (data.success) {
        // Refresh the last diagnostics
        await fetchLastDiagnostics()
      }
    } catch (error) {
      console.error('Diagnostics failed:', error)
    } finally {
      setIsRunning(false)
      setCurrentStep('')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-400" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Diagnostika" subtitle="Testování a hodnocení všech agentů" />

      <main className="flex-1 p-6 space-y-6">
        {/* Run Diagnostics Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Systémová diagnostika</h2>
            <p className="text-sm text-muted-foreground">
              Supervisor otestuje všechny agenty a zhodnotí kvalitu výstupů
            </p>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="gap-2 bg-gradient-to-r from-primary to-violet-500"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Probíhá...
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
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-violet-500 blur-lg opacity-50 animate-pulse" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-violet-500">
                  <Brain className="h-6 w-6 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Diagnostika běží</h3>
                <p className="text-sm text-muted-foreground">{currentStep}</p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="mt-4 flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !isRunning && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Last Diagnostics Results */}
        {!loading && lastDiagnostics && (
          <div className="space-y-6">
            {/* Overall Status Card */}
            <div
              className={cn(
                'rounded-xl border p-6',
                getStatusColor(lastDiagnostics.metadata?.overallStatus || 'unknown')
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(lastDiagnostics.metadata?.overallStatus || 'unknown')}
                  <div>
                    <h3 className="font-semibold">
                      {lastDiagnostics.metadata?.overallStatus === 'healthy' && 'Systém je zdravý'}
                      {lastDiagnostics.metadata?.overallStatus === 'warning' && 'Systém má varování'}
                      {lastDiagnostics.metadata?.overallStatus === 'critical' && 'Kritické problémy'}
                      {!lastDiagnostics.metadata?.overallStatus && 'Stav neznámý'}
                    </h3>
                    <p className="text-sm opacity-80">
                      Poslední test: {new Date(lastDiagnostics.created_at).toLocaleString('cs-CZ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>
                    {lastDiagnostics.metadata?.completedAt &&
                      lastDiagnostics.metadata?.startedAt &&
                      `${Math.round(
                        (new Date(lastDiagnostics.metadata.completedAt).getTime() -
                          new Date(lastDiagnostics.metadata.startedAt).getTime()) /
                          1000
                      )}s`}
                  </span>
                </div>
              </div>
            </div>

            {/* Agent Results Grid */}
            {lastDiagnostics.metadata?.agentResults && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Výsledky testů agentů</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {lastDiagnostics.metadata.agentResults.map((result) => (
                    <div
                      key={result.agentType}
                      className={cn(
                        'rounded-xl border p-4',
                        result.status === 'success'
                          ? 'border-emerald-500/30 bg-emerald-500/10'
                          : 'border-red-500/30 bg-red-500/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            result.status === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                          )}
                        >
                          {agentIcons[result.agentType] || <Activity className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {agentNames[result.agentType] || result.agentType}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {result.status === 'success' ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-400" />
                            )}
                            <span>{result.duration}ms</span>
                          </div>
                        </div>
                      </div>
                      {result.error && (
                        <p className="mt-2 text-xs text-red-400 truncate">{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Output */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Kompletní report</h3>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 max-h-[600px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans">{lastDiagnostics.output}</pre>
              </div>
            </div>
          </div>
        )}

        {/* No Diagnostics Yet */}
        {!loading && !lastDiagnostics && !isRunning && (
          <div className="rounded-xl border border-dashed border-white/20 p-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Žádná diagnostika</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Spusť diagnostiku pro otestování všech agentů
            </p>
            <Button onClick={runDiagnostics} className="gap-2">
              <Play className="h-4 w-4" />
              Spustit první diagnostiku
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

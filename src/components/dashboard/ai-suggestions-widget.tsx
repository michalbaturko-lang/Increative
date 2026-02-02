'use client'

import * as React from 'react'
import {
  Sparkles,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  Zap,
  AlertCircle,
  CheckCircle2,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ClickUpTask {
  id: string
  name: string
  description?: string
  status: { status: string; color: string }
  priority: { priority: string; color: string } | null
  folder: { id: string; name: string }
  list: { id: string; name: string }
  date_created: string
  url: string
}

interface TaskSuggestion {
  taskId: string
  suggestion?: string
  firstStep?: string
  estimatedTime?: string
  tools?: string[]
  error?: string
}

export function AISuggestionsWidget() {
  const [tasks, setTasks] = React.useState<ClickUpTask[]>([])
  const [suggestions, setSuggestions] = React.useState<Record<string, TaskSuggestion>>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [expandedTask, setExpandedTask] = React.useState<string | null>(null)
  const [generatingSuggestion, setGeneratingSuggestion] = React.useState<string | null>(null)

  const fetchRecentTasks = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/clickup?action=recent&limit=15')
      const result = await response.json()
      if (result.success) {
        setTasks(result.tasks)
      } else {
        setError(result.error || 'Nepodařilo se načíst úkoly')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání')
    } finally {
      setLoading(false)
    }
  }, [])

  const generateSuggestion = React.useCallback(async (task: ClickUpTask) => {
    if (suggestions[task.id]) return // Already have suggestion

    setGeneratingSuggestion(task.id)
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      })
      const result = await response.json()
      if (result.success) {
        setSuggestions(prev => ({
          ...prev,
          [task.id]: { taskId: task.id, ...result.suggestion },
        }))
      }
    } catch (err) {
      console.error('Failed to generate suggestion:', err)
    } finally {
      setGeneratingSuggestion(null)
    }
  }, [suggestions])

  React.useEffect(() => {
    fetchRecentTasks()
  }, [fetchRecentTasks])

  const handleTaskClick = (task: ClickUpTask) => {
    if (expandedTask === task.id) {
      setExpandedTask(null)
    } else {
      setExpandedTask(task.id)
      generateSuggestion(task)
    }
  }

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase()
    if (s.includes('progress') || s.includes('doing')) return 'bg-blue-500'
    if (s.includes('review')) return 'bg-amber-500'
    if (s.includes('blocked')) return 'bg-red-500'
    return 'bg-slate-500'
  }

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null
    const p = priority.toLowerCase()
    if (p === 'urgent') return <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">Urgent</span>
    if (p === 'high') return <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400">High</span>
    return null
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp))
    return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Načítám nejnovější úkoly...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div>
            <p className="font-medium text-red-400">Chyba</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchRecentTasks} className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Zkusit znovu
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">AI Návrhy řešení</h3>
            <p className="text-sm text-muted-foreground">
              {tasks.length} nejnovějších úkolů
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchRecentTasks} className="gap-2">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
        <p className="text-sm text-amber-200">
          <Zap className="h-4 w-4 inline mr-1" />
          Klikni na úkol pro vygenerování AI návrhu řešení
        </p>
      </div>

      {/* Tasks List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {tasks.map((task) => {
          const isExpanded = expandedTask === task.id
          const suggestion = suggestions[task.id]
          const isGenerating = generatingSuggestion === task.id

          return (
            <div
              key={task.id}
              className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
            >
              {/* Task Header */}
              <button
                onClick={() => handleTaskClick(task)}
                className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className={cn('h-2 w-2 rounded-full flex-shrink-0', getStatusColor(task.status?.status || ''))} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{task.name}</span>
                    {getPriorityBadge(task.priority?.priority || null)}
                    {suggestion && !suggestion.error && (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{task.folder?.name}</span>
                    <span>•</span>
                    <span>{formatDate(task.date_created)}</span>
                  </div>
                </div>

                <ChevronRight className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                  isExpanded && 'rotate-90'
                )} />
              </button>

              {/* Expanded Suggestion */}
              {isExpanded && (
                <div className="border-t border-white/10 p-3 bg-black/20 space-y-3">
                  {isGenerating ? (
                    <div className="flex items-center gap-2 py-4 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                      <span className="text-sm text-muted-foreground">Generuji návrh...</span>
                    </div>
                  ) : suggestion ? (
                    <>
                      {/* Suggestion */}
                      <div>
                        <h4 className="text-xs font-medium text-amber-400 mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Návrh řešení
                        </h4>
                        <p className="text-sm">{suggestion.suggestion}</p>
                      </div>

                      {/* First Step */}
                      {suggestion.firstStep && (
                        <div>
                          <h4 className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            První krok
                          </h4>
                          <p className="text-sm text-muted-foreground">{suggestion.firstStep}</p>
                        </div>
                      )}

                      {/* Time & Tools */}
                      <div className="flex items-center gap-4 text-xs">
                        {suggestion.estimatedTime && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {suggestion.estimatedTime}
                          </span>
                        )}
                        {suggestion.tools && suggestion.tools.length > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Wrench className="h-3 w-3" />
                            {suggestion.tools.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Open in ClickUp */}
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Otevřít v ClickUp
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nepodařilo se vygenerovat návrh
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

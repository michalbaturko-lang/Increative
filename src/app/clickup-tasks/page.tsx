'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { CreateTaskDialog } from '@/components/dashboard'
import { Button } from '@/components/ui'
import {
  Sparkles,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  Zap,
  AlertCircle,
  CheckSquare,
  Wrench,
  Filter,
} from 'lucide-react'
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
  suggestion?: string
  firstStep?: string
  estimatedTime?: string
  tools?: string[]
  error?: string
}

export default function ClickUpTasksPage() {
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [tasks, setTasks] = React.useState<ClickUpTask[]>([])
  const [suggestions, setSuggestions] = React.useState<Record<string, TaskSuggestion>>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [expandedTask, setExpandedTask] = React.useState<string | null>(null)
  const [generatingSuggestion, setGeneratingSuggestion] = React.useState<string | null>(null)
  const [taskLimit, setTaskLimit] = React.useState(30)

  const fetchRecentTasks = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/clickup?action=recent&limit=${taskLimit}`)
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
  }, [taskLimit])

  const generateSuggestion = React.useCallback(async (task: ClickUpTask) => {
    if (suggestions[task.id]) return

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
          [task.id]: result.suggestion,
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

  // Group tasks by client (folder)
  const tasksByClient = React.useMemo(() => {
    const grouped: Record<string, ClickUpTask[]> = {}
    for (const task of tasks) {
      const clientName = task.folder?.name || 'Ostatní'
      if (!grouped[clientName]) {
        grouped[clientName] = []
      }
      grouped[clientName].push(task)
    }
    return grouped
  }, [tasks])

  return (
    <div className="relative min-h-screen bg-background">
      <CreateTaskDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-orange-500/20 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header title="ClickUp úkoly" subtitle="AI návrhy řešení pro nejnovější úkoly" onNewTask={() => setCreateTaskOpen(true)} />
        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CheckSquare className="h-4 w-4" />
                <span className="text-sm">Načteno úkolů</span>
              </div>
              <p className="text-2xl font-bold">{tasks.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">AI návrhů</span>
              </div>
              <p className="text-2xl font-bold">{Object.keys(suggestions).length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm">Klientů</span>
              </div>
              <p className="text-2xl font-bold">{Object.keys(tasksByClient).length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Limit</p>
                <select
                  value={taskLimit}
                  onChange={(e) => setTaskLimit(Number(e.target.value))}
                  className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm"
                >
                  <option value={15}>15 úkolů</option>
                  <option value={30}>30 úkolů</option>
                  <option value={50}>50 úkolů</option>
                </select>
              </div>
              <Button variant="ghost" size="sm" onClick={() => fetchRecentTasks()} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-200">
              <Zap className="h-4 w-4 inline mr-2" />
              Zobrazuji <strong>{tasks.length}</strong> nejnovějších nedokončených úkolů z ClickUp.
              Klikni na úkol pro vygenerování AI návrhu řešení.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="font-medium text-red-400">Chyba</p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => fetchRecentTasks()} className="ml-auto">
                Zkusit znovu
              </Button>
            </div>
          )}

          {/* Tasks List */}
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Načítám úkoly z ClickUp...
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Žádné úkoly</h3>
                <p className="text-muted-foreground">V ClickUp nejsou žádné nedokončené úkoly.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {tasks.map((task) => {
                  const isExpanded = expandedTask === task.id
                  const suggestion = suggestions[task.id]
                  const isGenerating = generatingSuggestion === task.id

                  return (
                    <div key={task.id}>
                      {/* Task Row */}
                      <button
                        onClick={() => handleTaskClick(task)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className={cn('h-3 w-3 rounded-full flex-shrink-0', getStatusColor(task.status?.status || ''))} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{task.name}</span>
                            {getPriorityBadge(task.priority?.priority || null)}
                            {suggestion && !suggestion.error && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">
                                AI návrh
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-primary">{task.folder?.name}</span>
                            <span>•</span>
                            <span>{task.list?.name}</span>
                            <span>•</span>
                            <span>{formatDate(task.date_created)}</span>
                          </div>
                        </div>

                        <ChevronRight className={cn(
                          'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0',
                          isExpanded && 'rotate-90'
                        )} />
                      </button>

                      {/* Expanded Suggestion */}
                      {isExpanded && (
                        <div className="border-t border-white/10 p-4 bg-black/20 space-y-4">
                          {isGenerating ? (
                            <div className="flex items-center gap-2 py-6 justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                              <span className="text-sm text-muted-foreground">Generuji AI návrh řešení...</span>
                            </div>
                          ) : suggestion ? (
                            <>
                              {/* Suggestion */}
                              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                                <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4" />
                                  AI Návrh řešení
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
                              <div className="flex items-center gap-6 text-sm">
                                {suggestion.estimatedTime && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {suggestion.estimatedTime}
                                  </span>
                                )}
                                {suggestion.tools && suggestion.tools.length > 0 && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Wrench className="h-4 w-4" />
                                    {suggestion.tools.join(', ')}
                                  </span>
                                )}
                              </div>

                              {/* Open in ClickUp */}
                              <a
                                href={task.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                Otevřít v ClickUp
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nepodařilo se vygenerovat návrh
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

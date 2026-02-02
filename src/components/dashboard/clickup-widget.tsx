'use client'

import * as React from 'react'
import {
  CheckSquare,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Users,
  Folder,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ClickUpTask {
  id: string
  name: string
  status: { status: string; color: string }
  priority: { priority: string; color: string } | null
  assignees: { username: string }[]
  due_date: string | null
  url: string
  list: { id: string; name: string }
  folder: { id: string; name: string }
  space: { id: string }
}

interface ClickUpWorkspace {
  id: string
  name: string
}

interface ClientGroup {
  name: string
  id: string
  tasks: ClickUpTask[]
  summary: {
    total: number
    open: number
    inProgress: number
    done: number
  }
}

interface ClickUpData {
  success: boolean
  workspaces: ClickUpWorkspace[]
  tasks: ClickUpTask[]
  summary: {
    totalTasks: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
  }
  error?: string
}

export function ClickUpWidget() {
  const [data, setData] = React.useState<ClickUpData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [expandedClient, setExpandedClient] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/clickup?action=summary')
      const result = await response.json()
      if (result.success) {
        setData(result)
      } else {
        setError(result.error || 'Nepodařilo se načíst data z ClickUp')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Group tasks by folder (assuming folders = clients)
  const clientGroups = React.useMemo(() => {
    if (!data?.tasks) return []

    const groups: Record<string, ClientGroup> = {}

    for (const task of data.tasks) {
      // Use folder name as client, or list name if no folder
      const clientName = task.folder?.name || task.list?.name || 'Nezařazené'
      const clientId = task.folder?.id || task.list?.id || 'unknown'

      if (!groups[clientId]) {
        groups[clientId] = {
          name: clientName,
          id: clientId,
          tasks: [],
          summary: { total: 0, open: 0, inProgress: 0, done: 0 },
        }
      }

      groups[clientId].tasks.push(task)
      groups[clientId].summary.total++

      const status = task.status?.status?.toLowerCase() || ''
      if (status.includes('done') || status.includes('complete') || status.includes('closed')) {
        groups[clientId].summary.done++
      } else if (status.includes('progress') || status.includes('review') || status.includes('doing')) {
        groups[clientId].summary.inProgress++
      } else {
        groups[clientId].summary.open++
      }
    }

    return Object.values(groups).sort((a, b) => b.summary.total - a.summary.total)
  }, [data])

  // Generate AI-like summary
  const generateSummary = (clients: ClientGroup[]): string => {
    if (clients.length === 0) return 'Žádné aktivní projekty.'

    const totalTasks = clients.reduce((sum, c) => sum + c.summary.total, 0)
    const totalOpen = clients.reduce((sum, c) => sum + c.summary.open, 0)
    const totalInProgress = clients.reduce((sum, c) => sum + c.summary.inProgress, 0)

    const activeClients = clients.filter(c => c.summary.open + c.summary.inProgress > 0)

    let summary = `Celkem ${totalTasks} úkolů pro ${clients.length} klientů. `

    if (totalInProgress > 0) {
      summary += `${totalInProgress} úkolů právě probíhá. `
    }

    if (totalOpen > 0) {
      summary += `${totalOpen} úkolů čeká na zpracování. `
    }

    if (activeClients.length > 0) {
      const topClients = activeClients.slice(0, 3).map(c => c.name).join(', ')
      summary += `Aktivní klienti: ${topClients}.`
    }

    return summary
  }

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase()
    if (s.includes('done') || s.includes('complete')) return 'bg-emerald-500'
    if (s.includes('progress') || s.includes('doing')) return 'bg-blue-500'
    if (s.includes('review')) return 'bg-amber-500'
    if (s.includes('urgent') || s.includes('blocked')) return 'bg-red-500'
    return 'bg-slate-500'
  }

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return 'text-muted-foreground'
    const p = priority.toLowerCase()
    if (p === 'urgent') return 'text-red-400'
    if (p === 'high') return 'text-orange-400'
    if (p === 'normal') return 'text-blue-400'
    return 'text-muted-foreground'
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
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
            <p className="font-medium text-red-400">ClickUp Error</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="mt-4 gap-2"
        >
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">ClickUp</h3>
            <p className="text-sm text-muted-foreground">
              {data?.summary?.totalTasks || 0} úkolů
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="text-sm">{generateSummary(clientGroups)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">
            {data?.summary?.byStatus?.['complete'] || data?.summary?.byStatus?.['done'] || 0}
          </p>
          <p className="text-xs text-muted-foreground">Hotovo</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {clientGroups.reduce((sum, c) => sum + c.summary.inProgress, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Probíhá</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {clientGroups.reduce((sum, c) => sum + c.summary.open, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Čeká</p>
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Klienti ({clientGroups.length})
        </h4>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {clientGroups.map((client) => (
            <div
              key={client.id}
              className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
            >
              {/* Client Header */}
              <button
                onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{client.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-emerald-400">{client.summary.done}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-blue-400">{client.summary.inProgress}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-amber-400">{client.summary.open}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      expandedClient === client.id && 'rotate-90'
                    )}
                  />
                </div>
              </button>

              {/* Client Tasks */}
              {expandedClient === client.id && (
                <div className="border-t border-white/10 p-2 space-y-1 bg-black/20">
                  {client.tasks.slice(0, 10).map((task) => (
                    <a
                      key={task.id}
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-white/5 transition-colors group"
                    >
                      <div
                        className={cn('h-2 w-2 rounded-full', getStatusColor(task.status?.status || ''))}
                      />
                      <span className="flex-1 text-sm truncate">{task.name}</span>
                      {task.priority && (
                        <span className={cn('text-xs', getPriorityColor(task.priority.priority))}>
                          {task.priority.priority}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(parseInt(task.due_date)).toLocaleDateString('cs-CZ')}
                        </span>
                      )}
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                  {client.tasks.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{client.tasks.length - 10} dalších úkolů
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

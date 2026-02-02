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
  Loader2,
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
}

interface ClickUpFolder {
  id: string
  name: string
  spaceId: string
  taskCount?: number
}

interface ClickUpStructure {
  success: boolean
  workspaces: { id: string; name: string }[]
  spaces: { id: string; name: string; workspaceId: string }[]
  folders: ClickUpFolder[]
  summary: {
    totalClients: number
    totalWorkspaces: number
  }
  error?: string
}

export function ClickUpWidget() {
  const [structure, setStructure] = React.useState<ClickUpStructure | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [expandedClient, setExpandedClient] = React.useState<string | null>(null)
  const [clientTasks, setClientTasks] = React.useState<Record<string, ClickUpTask[]>>({})
  const [loadingTasks, setLoadingTasks] = React.useState<string | null>(null)

  const fetchStructure = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/clickup?action=structure')
      const result = await response.json()
      if (result.success) {
        setStructure(result)
      } else {
        setError(result.error || 'Nepodařilo se načíst data z ClickUp')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClientTasks = React.useCallback(async (folderId: string) => {
    if (clientTasks[folderId]) return // Already loaded

    setLoadingTasks(folderId)
    try {
      const response = await fetch(`/api/clickup?action=folder-tasks&folderId=${folderId}`)
      const result = await response.json()
      if (result.success) {
        setClientTasks(prev => ({ ...prev, [folderId]: result.tasks }))
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoadingTasks(null)
    }
  }, [clientTasks])

  React.useEffect(() => {
    fetchStructure()
  }, [fetchStructure])

  const handleClientClick = (folderId: string) => {
    if (expandedClient === folderId) {
      setExpandedClient(null)
    } else {
      setExpandedClient(folderId)
      fetchClientTasks(folderId)
    }
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

  // Generate summary
  const generateSummary = (): string => {
    if (!structure || structure.folders.length === 0) return 'Žádní klienti v ClickUp.'

    const totalTasks = structure.folders.reduce((sum, f) => sum + (f.taskCount || 0), 0)
    return `${structure.folders.length} klientů v ClickUp, celkem ${totalTasks} úkolů.`
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Načítám ClickUp...</span>
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
          onClick={fetchStructure}
          className="mt-4 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Zkusit znovu
        </Button>
      </div>
    )
  }

  const folders = structure?.folders || []

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
              {structure?.summary?.totalClients || 0} klientů
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchStructure} className="gap-2">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <p className="text-sm">{generateSummary()}</p>
      </div>

      {/* Clients List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Klienti ({folders.length})
        </h4>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
            >
              {/* Client Header */}
              <button
                onClick={() => handleClientClick(folder.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{folder.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {folder.taskCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {folder.taskCount} úkolů
                    </span>
                  )}
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      expandedClient === folder.id && 'rotate-90'
                    )}
                  />
                </div>
              </button>

              {/* Client Tasks */}
              {expandedClient === folder.id && (
                <div className="border-t border-white/10 p-2 space-y-1 bg-black/20">
                  {loadingTasks === folder.id ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Načítám úkoly...</span>
                    </div>
                  ) : clientTasks[folder.id]?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Žádné aktivní úkoly
                    </p>
                  ) : (
                    <>
                      {clientTasks[folder.id]?.slice(0, 15).map((task) => (
                        <a
                          key={task.id}
                          href={task.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-white/5 transition-colors group"
                        >
                          <div
                            className={cn('h-2 w-2 rounded-full flex-shrink-0', getStatusColor(task.status?.status || ''))}
                          />
                          <span className="flex-1 text-sm truncate">{task.name}</span>
                          {task.priority && (
                            <span className={cn('text-xs flex-shrink-0', getPriorityColor(task.priority.priority))}>
                              {task.priority.priority}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              {new Date(parseInt(task.due_date)).toLocaleDateString('cs-CZ')}
                            </span>
                          )}
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                      ))}
                      {(clientTasks[folder.id]?.length || 0) > 15 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          +{(clientTasks[folder.id]?.length || 0) - 15} dalších úkolů
                        </p>
                      )}
                    </>
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

'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { Button, Input } from '@/components/ui'
import { CreateTaskDialog } from '@/components/dashboard'
import {
  Users,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Folder,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
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
  date_created: string
  date_updated: string
}

interface ClickUpClient {
  id: string
  name: string
  spaceId: string
  taskCount: number
}

interface ClientInsight {
  services: string[]
  recentWork: string[]
  activeProjects: number
  completedProjects: number
  lastActivity: string | null
}

interface ClickUpStructure {
  success: boolean
  folders: ClickUpClient[]
  summary: { totalClients: number }
  lastUpdated?: string
  error?: string
}

export default function ClientsPage() {
  const [structure, setStructure] = React.useState<ClickUpStructure | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [expandedClient, setExpandedClient] = React.useState<string | null>(null)
  const [clientTasks, setClientTasks] = React.useState<Record<string, ClickUpTask[]>>({})
  const [clientInsights, setClientInsights] = React.useState<Record<string, ClientInsight>>({})
  const [loadingTasks, setLoadingTasks] = React.useState<string | null>(null)

  // Check if we should refresh (once per day)
  const shouldRefresh = React.useCallback(() => {
    const lastUpdated = localStorage.getItem('clickup_last_updated')
    if (!lastUpdated) return true

    const lastDate = new Date(lastUpdated)
    const now = new Date()
    const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60)
    return hoursDiff >= 24
  }, [])

  const fetchStructure = React.useCallback(async (force = false) => {
    // Try to use cached data first
    if (!force) {
      const cached = localStorage.getItem('clickup_structure')
      if (cached && !shouldRefresh()) {
        try {
          const parsed = JSON.parse(cached)
          setStructure(parsed)
          setLoading(false)
          return
        } catch {}
      }
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/clickup?action=structure')
      const result = await response.json()
      if (result.success) {
        const dataWithTimestamp = { ...result, lastUpdated: new Date().toISOString() }
        setStructure(dataWithTimestamp)
        localStorage.setItem('clickup_structure', JSON.stringify(dataWithTimestamp))
        localStorage.setItem('clickup_last_updated', new Date().toISOString())
      } else {
        setError(result.error || 'Nepodařilo se načíst data z ClickUp')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání')
    } finally {
      setLoading(false)
    }
  }, [shouldRefresh])

  const fetchClientTasks = React.useCallback(async (folderId: string) => {
    if (clientTasks[folderId]) {
      // Use cached tasks but analyze them
      analyzeClientTasks(folderId, clientTasks[folderId])
      return
    }

    setLoadingTasks(folderId)
    try {
      const response = await fetch(`/api/clickup?action=folder-tasks&folderId=${folderId}`)
      const result = await response.json()
      if (result.success) {
        setClientTasks(prev => ({ ...prev, [folderId]: result.tasks }))
        analyzeClientTasks(folderId, result.tasks)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoadingTasks(null)
    }
  }, [clientTasks])

  // Analyze tasks to learn what services/work is done for client
  const analyzeClientTasks = (clientId: string, tasks: ClickUpTask[]) => {
    const services = new Set<string>()
    const recentWork: string[] = []
    let activeProjects = 0
    let completedProjects = 0
    let lastActivity: string | null = null

    // Service keywords to detect
    const serviceKeywords: Record<string, string[]> = {
      'Web Development': ['web', 'website', 'stránk', 'redesign', 'landing', 'eshop', 'e-shop'],
      'SEO': ['seo', 'optimalizace', 'klíčová slova', 'keyword', 'pozice', 'rank'],
      'PPC / Ads': ['ppc', 'ads', 'kampaň', 'reklam', 'google ads', 'sklik', 'meta ads', 'facebook'],
      'Social Media': ['social', 'instagram', 'facebook', 'linkedin', 'post', 'příspěv'],
      'Content': ['content', 'obsah', 'článek', 'blog', 'copywriting', 'text'],
      'Email Marketing': ['email', 'newsletter', 'mailing', 'mailchimp'],
      'Grafika': ['grafik', 'design', 'banner', 'vizuál', 'logo', 'brand'],
      'Video': ['video', 'youtube', 'reel', 'spot'],
      'Analytika': ['analytics', 'analytik', 'report', 'měření', 'tracking'],
    }

    for (const task of tasks) {
      const taskName = task.name.toLowerCase()
      const listName = task.list?.name?.toLowerCase() || ''

      // Detect services
      for (const [service, keywords] of Object.entries(serviceKeywords)) {
        if (keywords.some(kw => taskName.includes(kw) || listName.includes(kw))) {
          services.add(service)
        }
      }

      // Count active vs completed
      const status = task.status?.status?.toLowerCase() || ''
      if (status.includes('done') || status.includes('complete') || status.includes('closed')) {
        completedProjects++
      } else {
        activeProjects++
        // Add to recent work (non-completed tasks)
        if (recentWork.length < 5) {
          recentWork.push(task.name)
        }
      }

      // Track last activity
      if (task.date_updated) {
        if (!lastActivity || task.date_updated > lastActivity) {
          lastActivity = task.date_updated
        }
      }
    }

    setClientInsights(prev => ({
      ...prev,
      [clientId]: {
        services: Array.from(services),
        recentWork,
        activeProjects,
        completedProjects,
        lastActivity,
      }
    }))
  }

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
    return 'bg-slate-500'
  }

  const folders = structure?.folders || []
  const filteredClients = folders.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatLastUpdate = () => {
    if (!structure?.lastUpdated) return null
    const date = new Date(structure.lastUpdated)
    return date.toLocaleString('cs-CZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="relative min-h-screen bg-background">
      <CreateTaskDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header title="Klienti" subtitle="Přehled klientů z ClickUp" onNewTask={() => setCreateTaskOpen(true)} />
        <main className="p-6 space-y-6">
          {/* Search and Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat klienty..."
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <div className="flex items-center gap-3">
              {formatLastUpdate() && (
                <span className="text-xs text-muted-foreground">
                  Aktualizováno: {formatLastUpdate()}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={() => fetchStructure(true)} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Klientů v ClickUp</span>
              </div>
              <p className="text-2xl font-bold">{folders.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Celkem úkolů</span>
              </div>
              <p className="text-2xl font-bold">
                {folders.reduce((sum, f) => sum + (f.taskCount || 0), 0)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">Analyzováno</span>
              </div>
              <p className="text-2xl font-bold">{Object.keys(clientInsights).length}</p>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="font-medium text-red-400">Chyba při načítání ClickUp</p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => fetchStructure(true)} className="ml-auto">
                Zkusit znovu
              </Button>
            </div>
          )}

          {/* Clients List */}
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Načítám klienty z ClickUp...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'Žádní klienti nenalezeni' : 'Žádní klienti v ClickUp'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Zkuste upravit vyhledávání.' : 'Přidejte klienty jako složky v ClickUp.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredClients.map((client) => {
                  const insight = clientInsights[client.id]
                  const isExpanded = expandedClient === client.id
                  const tasks = clientTasks[client.id] || []

                  return (
                    <div key={client.id}>
                      {/* Client Row */}
                      <button
                        onClick={() => handleClientClick(client.id)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white font-bold">
                          {client.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium flex items-center gap-2">
                            {client.name}
                            {insight && (
                              <span title="Analyzováno">
                                <Sparkles className="h-3 w-3 text-amber-400" />
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Folder className="h-3 w-3" />
                              {client.taskCount || 0} úkolů
                            </span>
                            {insight && insight.services.length > 0 && (
                              <span className="flex items-center gap-1 text-primary">
                                <TrendingUp className="h-3 w-3" />
                                {insight.services.slice(0, 2).join(', ')}
                                {insight.services.length > 2 && ` +${insight.services.length - 2}`}
                              </span>
                            )}
                          </div>
                        </div>

                        {insight && (
                          <div className="flex items-center gap-4 text-xs">
                            <div className="text-center">
                              <p className="text-emerald-400 font-bold">{insight.completedProjects}</p>
                              <p className="text-muted-foreground">Hotovo</p>
                            </div>
                            <div className="text-center">
                              <p className="text-blue-400 font-bold">{insight.activeProjects}</p>
                              <p className="text-muted-foreground">Aktivní</p>
                            </div>
                          </div>
                        )}

                        <ChevronRight className={cn(
                          'h-5 w-5 text-muted-foreground transition-transform',
                          isExpanded && 'rotate-90'
                        )} />
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-white/10 bg-black/20">
                          {loadingTasks === client.id ? (
                            <div className="p-6 text-center">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Analyzuji klienta...</p>
                            </div>
                          ) : (
                            <div className="p-4 space-y-4">
                              {/* Insights */}
                              {insight && (
                                <div className="space-y-3">
                                  {/* Services */}
                                  {insight.services.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                        <Sparkles className="h-3 w-3" />
                                        Detekované služby
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {insight.services.map(service => (
                                          <span
                                            key={service}
                                            className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary"
                                          >
                                            {service}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Recent Work */}
                                  {insight.recentWork.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3" />
                                        Aktuálně se pracuje na
                                      </h4>
                                      <ul className="space-y-1">
                                        {insight.recentWork.map((work, i) => (
                                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                            {work}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Tasks */}
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                                  Úkoly ({tasks.length})
                                </h4>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                  {tasks.slice(0, 20).map((task) => (
                                    <a
                                      key={task.id}
                                      href={task.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 rounded-md hover:bg-white/5 transition-colors group"
                                    >
                                      <div className={cn('h-2 w-2 rounded-full flex-shrink-0', getStatusColor(task.status?.status || ''))} />
                                      <span className="flex-1 text-sm truncate">{task.name}</span>
                                      {task.due_date && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {new Date(parseInt(task.due_date)).toLocaleDateString('cs-CZ')}
                                        </span>
                                      )}
                                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                    </a>
                                  ))}
                                  {tasks.length > 20 && (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      +{tasks.length - 20} dalších úkolů
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
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

'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { Badge, Button } from '@/components/ui'
import { CreateTaskDialog } from '@/components/dashboard'
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Filter,
  RefreshCw,
  FileText,
  Search,
  Megaphone,
  Users,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  type: string
  title: string
  description: string | null
  status: string
  priority: string
  client_name: string | null
  agent_type: string | null
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  queued: { label: 'Ve frontě', color: 'bg-slate-500/20 text-slate-400', icon: <Clock className="h-3 w-3" /> },
  processing: { label: 'Zpracovává se', color: 'bg-violet-500/20 text-violet-400', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
  in_progress: { label: 'Probíhá', color: 'bg-blue-500/20 text-blue-400', icon: <Play className="h-3 w-3" /> },
  completed: { label: 'Dokončeno', color: 'bg-emerald-500/20 text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  needs_review: { label: 'Ke kontrole', color: 'bg-amber-500/20 text-amber-400', icon: <AlertCircle className="h-3 w-3" /> },
  failed: { label: 'Selhalo', color: 'bg-red-500/20 text-red-400', icon: <AlertCircle className="h-3 w-3" /> },
}

const typeIcons: Record<string, React.ReactNode> = {
  content_creation: <FileText className="h-4 w-4 text-blue-400" />,
  seo_audit: <Search className="h-4 w-4 text-green-400" />,
  ads_campaign: <Megaphone className="h-4 w-4 text-orange-400" />,
  competitor_analysis: <Users className="h-4 w-4 text-purple-400" />,
}

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState('all')
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)

  const fetchTasks = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all' && filter !== 'active') {
        params.set('status', filter)
      }
      const response = await fetch(`/api/tasks?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        let filtered = data.tasks
        if (filter === 'active') {
          filtered = data.tasks.filter((t: Task) =>
            ['queued', 'processing', 'in_progress', 'needs_review'].includes(t.status)
          )
        }
        setTasks(filtered)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  React.useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('cs-CZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const tasksByStatus = {
    queued: tasks.filter(t => t.status === 'queued').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    needs_review: tasks.filter(t => t.status === 'needs_review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  }

  return (
    <div className="relative min-h-screen bg-background">
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onSubmit={() => fetchTasks()}
      />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header
          title="Úkoly"
          subtitle="Správa a přehled všech úkolů"
          onNewTask={() => setCreateTaskOpen(true)}
        />
        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            {(['processing', 'queued', 'in_progress', 'needs_review', 'completed'] as const).map((key) => {
              const config = statusConfig[key]
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10',
                    filter === key && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    {config.icon}
                    <span className="text-sm">{config.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{tasksByStatus[key]}</p>
                </button>
              )
            })}
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {[
                  { value: 'all', label: 'Vše' },
                  { value: 'active', label: 'Aktivní' },
                  { value: 'completed', label: 'Dokončené' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filter === f.value
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchTasks} className="gap-2">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Obnovit
            </Button>
          </div>

          {/* Tasks List */}
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Načítám úkoly...
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Žádné úkoly</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'all' ? 'Zatím nemáte žádné úkoly.' : 'Žádné úkoly v této kategorii.'}
                </p>
                <Button onClick={() => setCreateTaskOpen(true)} className="gap-2">
                  Vytvořit úkol
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                      {typeIcons[task.type] || <FileText className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{task.title}</h3>
                        {task.client_name && (
                          <span className="text-xs text-muted-foreground">• {task.client_name}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDate(task.created_at)}</p>
                    </div>

                    <Badge className={cn('border', statusConfig[task.status]?.color || 'bg-white/10')}>
                      {statusConfig[task.status]?.icon}
                      <span className="ml-1">{statusConfig[task.status]?.label || task.status}</span>
                    </Badge>

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

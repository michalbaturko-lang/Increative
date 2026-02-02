'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { AgentCard, TaskQueue, StatsCards, PendingQuestions, CreateTaskDialog, ClickUpWidget } from '@/components/dashboard'
import { useAuth } from '@/components/providers/auth-provider'
import type { Agent, Task, DashboardStats } from '@/types'

// Static agents - AI agents don't change
const agents: Agent[] = [
  {
    id: '1',
    name: 'Supervisor',
    role: 'supervisor',
    status: 'idle',
    capabilities: ['content_writing', 'seo_analysis', 'competitor_analysis', 'ads_management', 'strategy'],
    currentTaskId: null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 0, tasksInProgress: 0, averageTaskDuration: 0, successRate: 0, learningsContributed: 0 },
  },
  {
    id: '2',
    name: 'Content Writer',
    role: 'worker',
    status: 'idle',
    capabilities: ['content_writing', 'seo_analysis', 'strategy'],
    currentTaskId: null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 0, tasksInProgress: 0, averageTaskDuration: 0, successRate: 0, learningsContributed: 0 },
  },
  {
    id: '3',
    name: 'SEO Analyst',
    role: 'worker',
    status: 'idle',
    capabilities: ['seo_analysis', 'competitor_analysis', 'data_analysis'],
    currentTaskId: null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 0, tasksInProgress: 0, averageTaskDuration: 0, successRate: 0, learningsContributed: 0 },
  },
  {
    id: '4',
    name: 'Ads Specialist',
    role: 'worker',
    status: 'idle',
    capabilities: ['ads_management', 'data_analysis', 'strategy'],
    currentTaskId: null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 0, tasksInProgress: 0, averageTaskDuration: 0, successRate: 0, learningsContributed: 0 },
  },
  {
    id: '5',
    name: 'Social Media',
    role: 'worker',
    status: 'idle',
    capabilities: ['social_media', 'content_writing'],
    currentTaskId: null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 0, tasksInProgress: 0, averageTaskDuration: 0, successRate: 0, learningsContributed: 0 },
  },
  {
    id: '6',
    name: 'Email Marketing',
    role: 'worker',
    status: 'idle',
    capabilities: ['content_writing', 'data_analysis'],
    currentTaskId: null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 0, tasksInProgress: 0, averageTaskDuration: 0, successRate: 0, learningsContributed: 0 },
  },
]

// Convert DB task to frontend Task format
function dbTaskToTask(dbTask: {
  id: string
  type: string
  title: string
  description: string | null
  status: string
  priority: string
  client_name: string | null
  agent_type: string | null
  output: string | null
  feedback: string | null
  needs_review: boolean
  created_at: string
  completed_at: string | null
}): Task {
  return {
    id: dbTask.id,
    type: dbTask.type as Task['type'],
    title: dbTask.title,
    description: dbTask.description || '',
    status: dbTask.status === 'needs_review' ? 'under_review' : dbTask.status as Task['status'],
    priority: dbTask.priority as Task['priority'],
    assignedAgentId: null,
    supervisorId: '1',
    clientId: null,
    clientName: dbTask.client_name || null,
    progress: dbTask.status === 'completed' ? 100 : 0,
    steps: [],
    currentStepIndex: 0,
    messages: [],
    pendingQuestion: null,
    output: dbTask.output ? { type: 'text' as const, content: dbTask.output, files: [], metadata: {} } : null,
    templateId: null,
    similarTaskIds: [],
    createdAt: new Date(dbTask.created_at),
    startedAt: new Date(dbTask.created_at),
    completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : null,
    estimatedDuration: 30,
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [stats, setStats] = React.useState<DashboardStats>({
    tasksToday: 0,
    tasksThisWeek: 0,
    averageCompletionTime: 0,
    activeClients: 0,
    opportunitiesDetected: 0,
    knowledgeEntries: 0,
  })
  const [recentTasks, setRecentTasks] = React.useState<Task[]>([])
  const [pendingReviewTasks, setPendingReviewTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setRecentTasks(data.recentTasks.map(dbTaskToTask))
        setPendingReviewTasks(data.pendingReview.map(dbTaskToTask))
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleTaskComplete = () => {
    // Refresh dashboard data after task completion
    fetchDashboardData()
  }

  // Generate pending questions from tasks that need review
  const pendingQuestions = pendingReviewTasks.map(task => ({
    task,
    question: {
      id: `q-${task.id}`,
      question: 'Tento úkol vyžaduje vaši kontrolu a schválení.',
      context: task.output?.content ? 'Výstup je připraven ke kontrole.' : '',
      options: ['Schválit', 'Zamítnout', 'Upravit'],
      askedAt: task.createdAt,
      askedBy: 'supervisor' as const,
    },
  }))

  return (
    <div className="relative min-h-screen bg-background">
      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onSubmit={handleTaskComplete}
      />
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header
          title="Dashboard"
          subtitle="Přehled aktivit a úkolů"
          onNewTask={() => setCreateTaskOpen(true)}
        />
        <main className="p-6 space-y-6">
          {/* Welcome message */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Ahoj{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} <span className="inline-block animate-pulse">👋</span>
              </h2>
              <p className="text-muted-foreground">
                {loading ? (
                  'Načítám data...'
                ) : (
                  <>
                    Dnes máš <span className="font-medium text-foreground">{stats.tasksToday} úkolů</span> a{' '}
                    <span className="font-medium text-foreground">{pendingReviewTasks.length} ke kontrole</span>.
                  </>
                )}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-400">Všichni agenti online</span>
            </div>
          </div>

          {/* Stats */}
          <StatsCards stats={stats} />

          {/* ClickUp Integration */}
          <ClickUpWidget />

          {/* Pending Questions - prominently displayed */}
          {pendingQuestions.length > 0 && (
            <PendingQuestions items={pendingQuestions} />
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Agents */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Agenti</h2>
                <span className="text-xs text-muted-foreground">{agents.length} aktivních</span>
              </div>
              <div className="space-y-3">
                {agents.map((agent, index) => (
                  <div key={agent.id} className="fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <AgentCard agent={agent} compact />
                  </div>
                ))}
              </div>
            </div>

            {/* Task Queue */}
            <div className="lg:col-span-2">
              <TaskQueue tasks={recentTasks} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

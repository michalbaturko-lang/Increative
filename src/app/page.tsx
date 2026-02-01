'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { AgentCard, TaskQueue, StatsCards, PendingQuestions, CreateTaskDialog } from '@/components/dashboard'
import type { Agent, Task, DashboardStats, PendingQuestion } from '@/types'

// Mock data - will be replaced with real data from Supabase
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Supervisor',
    role: 'supervisor',
    status: 'working',
    capabilities: ['content_writing', 'seo_analysis', 'competitor_analysis', 'ads_management', 'strategy'],
    currentTaskId: 'task-1',
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 156, tasksInProgress: 3, averageTaskDuration: 25, successRate: 94, learningsContributed: 45 },
  },
  {
    id: '2',
    name: 'Agent Alpha',
    role: 'worker',
    status: 'working',
    capabilities: ['content_writing', 'seo_analysis', 'strategy'],
    currentTaskId: 'task-2',
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 89, tasksInProgress: 1, averageTaskDuration: 18, successRate: 91, learningsContributed: 12 },
  },
  {
    id: '3',
    name: 'Agent Beta',
    role: 'worker',
    status: 'waiting',
    capabilities: ['ads_management', 'data_analysis', 'competitor_analysis'],
    currentTaskId: 'task-3',
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 67, tasksInProgress: 1, averageTaskDuration: 22, successRate: 88, learningsContributed: 8 },
  },
  {
    id: '4',
    name: 'Agent Gamma',
    role: 'worker',
    status: 'idle',
    capabilities: ['web_development', 'design'],
    currentTaskId: null,
    createdAt: new Date(),
    lastActiveAt: new Date(),
    stats: { tasksCompleted: 34, tasksInProgress: 0, averageTaskDuration: 45, successRate: 97, learningsContributed: 15 },
  },
]

const mockTasks: Task[] = [
  {
    id: 'task-1',
    type: 'seo_audit',
    title: 'SEO audit pro Beauty Salon Praha',
    description: 'Kompletní SEO audit webu včetně technické analýzy',
    status: 'in_progress',
    priority: 'high',
    assignedAgentId: '2',
    supervisorId: '1',
    clientId: 'client-1',
    clientName: 'Beauty Salon Praha',
    progress: 65,
    steps: [
      { id: '1', title: 'Crawl webu', description: '', status: 'completed', output: null },
      { id: '2', title: 'Technická analýza', description: '', status: 'completed', output: null },
      { id: '3', title: 'Obsahová analýza', description: '', status: 'in_progress', output: null },
      { id: '4', title: 'Konkurenční analýza', description: '', status: 'pending', output: null },
      { id: '5', title: 'Doporučení', description: '', status: 'pending', output: null },
    ],
    currentStepIndex: 2,
    messages: [],
    pendingQuestion: null,
    output: null,
    templateId: null,
    similarTaskIds: [],
    createdAt: new Date(Date.now() - 3600000),
    startedAt: new Date(Date.now() - 3000000),
    completedAt: null,
    estimatedDuration: 30,
  },
  {
    id: 'task-2',
    type: 'content_creation',
    title: 'Produktové popisky pro e-shop ModaStyle',
    description: 'Vytvořit poutavé popisky pro 15 nových produktů',
    status: 'needs_input',
    priority: 'medium',
    assignedAgentId: '3',
    supervisorId: '1',
    clientId: 'client-2',
    clientName: 'ModaStyle',
    progress: 40,
    steps: [
      { id: '1', title: 'Analýza produktů', description: '', status: 'completed', output: null },
      { id: '2', title: 'Tone of voice', description: '', status: 'completed', output: null },
      { id: '3', title: 'Psaní popisků', description: '', status: 'in_progress', output: null },
    ],
    currentStepIndex: 2,
    messages: [],
    pendingQuestion: {
      id: 'q-1',
      question: 'Jaký styl komunikace preferujete pro luxusní produkty? Formální nebo casual?',
      context: 'Produkty v kategorii "Premium Collection" mohou mít různý přístup.',
      options: ['Formální & elegantní', 'Casual & přátelský', 'Mix obou stylů'],
      askedAt: new Date(Date.now() - 1800000),
      askedBy: 'agent',
    },
    output: null,
    templateId: null,
    similarTaskIds: [],
    createdAt: new Date(Date.now() - 7200000),
    startedAt: new Date(Date.now() - 6000000),
    completedAt: null,
    estimatedDuration: 45,
  },
  {
    id: 'task-3',
    type: 'ads_campaign',
    title: 'Google Ads kampaň - Fitness centrum',
    description: 'Nastavení PPC kampaně pro nové fitness centrum',
    status: 'queued',
    priority: 'urgent',
    assignedAgentId: null,
    supervisorId: '1',
    clientId: 'client-3',
    clientName: 'FitLife Gym',
    progress: 0,
    steps: [],
    currentStepIndex: 0,
    messages: [],
    pendingQuestion: null,
    output: null,
    templateId: null,
    similarTaskIds: [],
    createdAt: new Date(Date.now() - 600000),
    startedAt: null,
    completedAt: null,
    estimatedDuration: 60,
  },
  {
    id: 'task-4',
    type: 'competitor_analysis',
    title: 'Analýza konkurence - realitní trh Praha',
    description: 'Mapování konkurentů v oblasti realitních služeb',
    status: 'in_progress',
    priority: 'medium',
    assignedAgentId: '2',
    supervisorId: '1',
    clientId: 'client-4',
    clientName: 'Prague Realty',
    progress: 30,
    steps: [
      { id: '1', title: 'Identifikace konkurentů', description: '', status: 'completed', output: null },
      { id: '2', title: 'Analýza webů', description: '', status: 'in_progress', output: null },
      { id: '3', title: 'Analýza marketingu', description: '', status: 'pending', output: null },
    ],
    currentStepIndex: 1,
    messages: [],
    pendingQuestion: null,
    output: null,
    templateId: null,
    similarTaskIds: [],
    createdAt: new Date(Date.now() - 5400000),
    startedAt: new Date(Date.now() - 4800000),
    completedAt: null,
    estimatedDuration: 40,
  },
]

const mockStats: DashboardStats = {
  tasksToday: 12,
  tasksThisWeek: 47,
  averageCompletionTime: 28,
  activeClients: 23,
  opportunitiesDetected: 8,
  knowledgeEntries: 156,
}

const mockPendingQuestions = mockTasks
  .filter(t => t.pendingQuestion)
  .map(t => ({ task: t, question: t.pendingQuestion! }))

export default function DashboardPage() {
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)

  return (
    <div className="relative min-h-screen bg-background">
      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onSubmit={(task) => {
          console.log('New task:', task)
          // TODO: Send to API / Supabase
        }}
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
                Ahoj, Jakube <span className="inline-block animate-pulse">👋</span>
              </h2>
              <p className="text-muted-foreground">
                Dnes máš <span className="font-medium text-foreground">3 čekající otázky</span> a{' '}
                <span className="font-medium text-foreground">4 aktivní úkoly</span>.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-400">Všichni agenti online</span>
            </div>
          </div>

          {/* Stats */}
          <StatsCards stats={mockStats} />

          {/* Pending Questions - prominently displayed */}
          <PendingQuestions items={mockPendingQuestions} />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Agents */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Agenti</h2>
                <span className="text-xs text-muted-foreground">{mockAgents.length} aktivních</span>
              </div>
              <div className="space-y-3">
                {mockAgents.map((agent, index) => (
                  <div key={agent.id} className="fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <AgentCard agent={agent} compact />
                  </div>
                ))}
              </div>
            </div>

            {/* Task Queue */}
            <div className="lg:col-span-2">
              <TaskQueue tasks={mockTasks} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

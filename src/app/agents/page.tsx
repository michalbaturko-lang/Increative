'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { Badge, Button } from '@/components/ui'
import {
  Brain,
  FileText,
  Search,
  Megaphone,
  BarChart3,
  Instagram,
  Mail,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentInfo {
  id: string
  name: string
  type: string
  description: string
  icon: React.ReactNode
  color: string
  capabilities: string[]
  stats: {
    tasksCompleted: number
    avgTime: string
    successRate: number
  }
}

const agents: AgentInfo[] = [
  {
    id: 'supervisor',
    name: 'Supervisor',
    type: 'supervisor',
    description: 'Koordinuje práci ostatních agentů, kontroluje kvalitu a rozhoduje o eskalaci.',
    icon: <Brain className="h-6 w-6" />,
    color: 'from-violet-500 to-purple-600',
    capabilities: ['Koordinace agentů', 'Quality control', 'Task routing', 'Eskalace'],
    stats: { tasksCompleted: 0, avgTime: '-', successRate: 0 },
  },
  {
    id: 'content_writer',
    name: 'Content Writer',
    type: 'worker',
    description: 'Píše blogové články, produktové popisky, texty na web a newsletter.',
    icon: <FileText className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-500',
    capabilities: ['Blog články', 'Produktové popisky', 'Web copy', 'Newsletter'],
    stats: { tasksCompleted: 0, avgTime: '-', successRate: 0 },
  },
  {
    id: 'seo_analyst',
    name: 'SEO Analyst',
    type: 'worker',
    description: 'Provádí SEO audity, analýzu klíčových slov a technické SEO.',
    icon: <Search className="h-6 w-6" />,
    color: 'from-green-500 to-emerald-500',
    capabilities: ['SEO audit', 'Keyword research', 'Technické SEO', 'Konkurenční analýza'],
    stats: { tasksCompleted: 0, avgTime: '-', successRate: 0 },
  },
  {
    id: 'ads_specialist',
    name: 'Ads Specialist',
    type: 'worker',
    description: 'Navrhuje a optimalizuje PPC kampaně pro Google Ads, Sklik a Meta.',
    icon: <Megaphone className="h-6 w-6" />,
    color: 'from-orange-500 to-red-500',
    capabilities: ['Google Ads', 'Sklik', 'Meta Ads', 'Remarketing'],
    stats: { tasksCompleted: 0, avgTime: '-', successRate: 0 },
  },
  {
    id: 'analyst',
    name: 'Business Analyst',
    type: 'worker',
    description: 'Analyzuje konkurenci, trh a klientská data. Vytváří reporty.',
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'from-pink-500 to-rose-500',
    capabilities: ['Analýza konkurence', 'Market research', 'SWOT', 'Reporting'],
    stats: { tasksCompleted: 0, avgTime: '-', successRate: 0 },
  },
  {
    id: 'social_media',
    name: 'Social Media',
    type: 'worker',
    description: 'Vytváří obsahové plány a příspěvky pro sociální sítě.',
    icon: <Instagram className="h-6 w-6" />,
    color: 'from-pink-500 to-purple-500',
    capabilities: ['Content plány', 'Příspěvky', 'Stories/Reels', 'Engagement'],
    stats: { tasksCompleted: 0, avgTime: '-', successRate: 0 },
  },
  {
    id: 'email_marketing',
    name: 'Email Marketing',
    type: 'worker',
    description: 'Navrhuje email kampaně, automatizace a newsletter sekvence.',
    icon: <Mail className="h-6 w-6" />,
    color: 'from-emerald-500 to-teal-500',
    capabilities: ['Newsletter', 'Automatizace', 'Welcome series', 'A/B testing'],
    stats: { tasksCompleted: 0, avgTime: '-', successRate: 0 },
  },
]

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = React.useState<AgentInfo | null>(null)

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header title="Agenti" subtitle="AI agenti a jejich schopnosti" />
        <main className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Brain className="h-4 w-4" />
                <span className="text-sm">Celkem agentů</span>
              </div>
              <p className="text-2xl font-bold">{agents.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Online</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{agents.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Úkolů dnes</span>
              </div>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Úspěšnost</span>
              </div>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, index) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={cn(
                  'fade-in rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:bg-white/10 hover:border-white/20',
                  selectedAgent?.id === agent.id && 'ring-2 ring-primary border-primary/50'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white', agent.color)}>
                    {agent.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-400">Online</span>
                  </div>
                </div>

                <h3 className="font-semibold mb-1">{agent.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{agent.description}</p>

                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map(cap => (
                    <Badge key={cap} className="bg-white/10 text-xs">{cap}</Badge>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Badge className="bg-white/10 text-xs">+{agent.capabilities.length - 3}</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Agent Detail Panel */}
          {selectedAgent && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 fade-in">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white', selectedAgent.color)}>
                    {selectedAgent.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                    <p className="text-muted-foreground">{selectedAgent.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Nastavení
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Capabilities */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Schopnosti</h3>
                  <div className="space-y-2">
                    {selectedAgent.capabilities.map(cap => (
                      <div key={cap} className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Statistiky</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Dokončených úkolů</span>
                      <span className="font-medium">{selectedAgent.stats.tasksCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Průměrný čas</span>
                      <span className="font-medium">{selectedAgent.stats.avgTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Úspěšnost</span>
                      <span className="font-medium">{selectedAgent.stats.successRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Poslední aktivita</h3>
                  <div className="text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Zatím žádná aktivita
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

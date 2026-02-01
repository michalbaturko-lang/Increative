'use client'

import { Bot, Crown, Pause, Play, AlertCircle } from 'lucide-react'
import { Card, CardContent, Badge, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Agent, AgentStatus } from '@/types'

interface AgentCardProps {
  agent: Agent
  compact?: boolean
}

const statusConfig: Record<AgentStatus, { label: string; variant: 'idle' | 'working' | 'waiting' | 'error' | 'default'; icon?: React.ReactNode }> = {
  idle: { label: 'Připraven', variant: 'idle' },
  working: { label: 'Pracuje', variant: 'working' },
  waiting: { label: 'Čeká na odpověď', variant: 'waiting', icon: <AlertCircle className="h-3 w-3" /> },
  reviewing: { label: 'Kontroluje', variant: 'working' },
  error: { label: 'Chyba', variant: 'error' },
  paused: { label: 'Pozastaven', variant: 'default', icon: <Pause className="h-3 w-3" /> },
}

export function AgentCard({ agent, compact = false }: AgentCardProps) {
  const status = statusConfig[agent.status]
  const isSupervisor = agent.role === 'supervisor'

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
        agent.status === 'working' && 'border-blue-500/50 bg-blue-500/5',
        agent.status === 'waiting' && 'border-yellow-500/50 bg-yellow-500/5',
        agent.status === 'error' && 'border-red-500/50 bg-red-500/5',
      )}>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          isSupervisor ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/20 text-primary'
        )}>
          {isSupervisor ? <Crown className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{agent.name}</span>
            <Badge variant={status.variant} className="gap-1">
              {status.icon}
              {status.label}
            </Badge>
          </div>
          {agent.currentTaskId && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              Task #{agent.currentTaskId.slice(0, 8)}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      'transition-all',
      agent.status === 'working' && 'border-blue-500/50 ring-1 ring-blue-500/20',
      agent.status === 'waiting' && 'border-yellow-500/50 ring-1 ring-yellow-500/20',
      agent.status === 'error' && 'border-red-500/50 ring-1 ring-red-500/20',
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              isSupervisor ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/20 text-primary',
              agent.status === 'working' && 'animate-pulse-slow'
            )}>
              {isSupervisor ? <Crown className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{agent.name}</h3>
                {isSupervisor && (
                  <Badge variant="warning" className="text-[10px]">Supervisor</Badge>
                )}
              </div>
              <Badge variant={status.variant} className="mt-1 gap-1">
                {status.icon}
                {status.label}
              </Badge>
            </div>
          </div>
        </div>

        {agent.currentTaskId && agent.status === 'working' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Probíhá úkol</span>
              <span>65%</span>
            </div>
            <Progress value={65} className="h-1.5" />
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{agent.stats.tasksCompleted} dokončeno</span>
          <span>{agent.stats.successRate}% úspěšnost</span>
        </div>

        {/* Capabilities */}
        <div className="mt-3 flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((cap) => (
            <Badge key={cap} variant="secondary" className="text-[10px]">
              {cap.replace('_', ' ')}
            </Badge>
          ))}
          {agent.capabilities.length > 3 && (
            <Badge variant="secondary" className="text-[10px]">
              +{agent.capabilities.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

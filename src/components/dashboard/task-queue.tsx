'use client'

import {
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  User,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress, Button } from '@/components/ui'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { Task, TaskStatus, TaskPriority } from '@/types'

interface TaskQueueProps {
  tasks: Task[]
  showCompleted?: boolean
}

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; color: string }> = {
  queued: { icon: <Circle className="h-4 w-4" />, color: 'text-muted-foreground' },
  assigned: { icon: <Circle className="h-4 w-4" />, color: 'text-muted-foreground' },
  in_progress: { icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'text-blue-500' },
  needs_input: { icon: <MessageSquare className="h-4 w-4" />, color: 'text-yellow-500' },
  under_review: { icon: <Clock className="h-4 w-4" />, color: 'text-purple-500' },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-500' },
  failed: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-500' },
  cancelled: { icon: <Circle className="h-4 w-4" />, color: 'text-muted-foreground' },
}

const priorityConfig: Record<TaskPriority, { label: string; variant: 'default' | 'destructive' | 'warning' | 'secondary' }> = {
  low: { label: 'Nízká', variant: 'secondary' },
  medium: { label: 'Střední', variant: 'default' },
  high: { label: 'Vysoká', variant: 'warning' },
  urgent: { label: 'Urgentní', variant: 'destructive' },
}

export function TaskQueue({ tasks, showCompleted = false }: TaskQueueProps) {
  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter(t => !['completed', 'cancelled', 'failed'].includes(t.status))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Fronta úkolů</CardTitle>
          <Badge variant="secondary">{filteredTasks.length} aktivních</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Circle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Žádné aktivní úkoly</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))
        )}
      </CardContent>
    </Card>
  )
}

function TaskItem({ task }: { task: Task }) {
  const status = statusConfig[task.status]
  const priority = priorityConfig[task.priority]
  const needsAttention = task.status === 'needs_input'

  return (
    <div className={cn(
      'group rounded-lg border p-4 transition-all hover:border-primary/50',
      needsAttention && 'border-yellow-500/50 bg-yellow-500/5',
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', status.color)}>
          {status.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium truncate">{task.title}</h4>
            <Badge variant={priority.variant} className="text-[10px]">
              {priority.label}
            </Badge>
          </div>

          {task.clientName && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{task.clientName}</span>
            </div>
          )}

          {/* Progress bar for in-progress tasks */}
          {task.status === 'in_progress' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>
                  Krok {task.currentStepIndex + 1} z {task.steps.length}
                </span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-1" />
            </div>
          )}

          {/* Pending question */}
          {task.pendingQuestion && (
            <div className="mt-3 rounded-md bg-yellow-500/10 p-3">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {task.pendingQuestion.question}
              </p>
              <Button size="sm" className="mt-2 gap-1">
                Odpovědět
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{formatRelativeTime(task.createdAt)}</span>
            {task.assignedAgentId && (
              <span className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Agent přiřazen
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

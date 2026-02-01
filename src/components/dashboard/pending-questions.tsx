'use client'

import { MessageSquare, ArrowRight, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Textarea } from '@/components/ui'
import { formatRelativeTime } from '@/lib/utils'
import type { Task, PendingQuestion } from '@/types'

interface PendingQuestionsProps {
  items: Array<{ task: Task; question: PendingQuestion }>
}

export function PendingQuestions({ items }: PendingQuestionsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <Card className="border-yellow-500/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">Čeká na odpověď</CardTitle>
          <Badge variant="warning">{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(({ task, question }) => (
          <div
            key={question.id}
            className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{task.type.replace('_', ' ')}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {task.title}
                  </span>
                </div>
                <p className="font-medium text-yellow-600 dark:text-yellow-400">
                  {question.question}
                </p>
                {question.context && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {question.context}
                  </p>
                )}

                {/* Multiple choice options */}
                {question.options && question.options.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {question.options.map((option, i) => (
                      <Button key={i} variant="outline" size="sm">
                        {option}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Free text response */}
                {!question.options && (
                  <div className="mt-3">
                    <Textarea
                      placeholder="Napište odpověď..."
                      className="min-h-[80px]"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" className="gap-1">
                        Odeslat odpověď
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Otázka položena {formatRelativeTime(question.askedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

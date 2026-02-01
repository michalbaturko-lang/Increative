'use client'

import * as React from 'react'
import {
  FileText,
  Search,
  Users,
  BarChart3,
  Globe,
  Megaphone,
  Lightbulb,
  Code,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button, Input, Textarea, Badge } from '@/components/ui'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { TaskType, TaskPriority } from '@/types'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (task: TaskFormData) => void
}

interface TaskFormData {
  type: TaskType
  title: string
  description: string
  priority: TaskPriority
  clientName: string
}

const taskTypes = [
  { value: 'content_creation', label: 'Tvorba obsahu', icon: <FileText className="h-4 w-4 text-blue-400" /> },
  { value: 'seo_audit', label: 'SEO audit', icon: <Search className="h-4 w-4 text-green-400" /> },
  { value: 'competitor_analysis', label: 'Analýza konkurence', icon: <Users className="h-4 w-4 text-purple-400" /> },
  { value: 'ads_campaign', label: 'Reklamní kampaň', icon: <Megaphone className="h-4 w-4 text-orange-400" /> },
  { value: 'strategy_creation', label: 'Marketingová strategie', icon: <Lightbulb className="h-4 w-4 text-yellow-400" /> },
  { value: 'mvp_creation', label: 'MVP / Prototyp', icon: <Code className="h-4 w-4 text-cyan-400" /> },
  { value: 'client_analysis', label: 'Analýza klienta', icon: <BarChart3 className="h-4 w-4 text-pink-400" /> },
  { value: 'report_generation', label: 'Generování reportu', icon: <Globe className="h-4 w-4 text-indigo-400" /> },
]

const priorities = [
  { value: 'low', label: 'Nízká', color: 'bg-slate-500/20 text-slate-400' },
  { value: 'medium', label: 'Střední', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'high', label: 'Vysoká', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'urgent', label: 'Urgentní', color: 'bg-red-500/20 text-red-400' },
]

export function CreateTaskDialog({ open, onOpenChange, onSubmit }: CreateTaskDialogProps) {
  const [formData, setFormData] = React.useState<TaskFormData>({
    type: 'content_creation',
    title: '',
    description: '',
    priority: 'medium',
    clientName: '',
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    onSubmit?.(formData)
    setIsSubmitting(false)
    onOpenChange(false)

    // Reset form
    setFormData({
      type: 'content_creation',
      title: '',
      description: '',
      priority: 'medium',
      clientName: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>Nový úkol</DialogTitle>
              <DialogDescription>Zadej úkol pro AI agenty</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Typ úkolu</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as TaskType })}
              options={taskTypes}
              placeholder="Vyber typ úkolu"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Název úkolu</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="např. SEO audit pro e-shop Krásná móda"
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Klient <span className="text-muted-foreground">(volitelné)</span></label>
            <Input
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Název klienta"
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Popis</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Popiš, co přesně má agent udělat. Čím víc detailů, tím lepší výsledek."
              className="min-h-[100px] bg-white/5 border-white/10"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priorita</label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p.value as TaskPriority })}
                  className={cn(
                    'flex-1 rounded-xl border py-2 text-sm font-medium transition-all',
                    formData.priority === p.value
                      ? `${p.color} border-current`
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Suggestion Box */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-violet-500/20 p-2">
                <Zap className="h-4 w-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-violet-300">Tip od AI</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pro nejlepší výsledky přidej do popisu konkrétní požadavky, cílovou skupinu,
                  a případně odkaz na web klienta pro analýzu stylu.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={!formData.title.trim() || isSubmitting}
              className="gap-2 bg-gradient-to-r from-primary to-violet-500"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Vytvářím...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Vytvořit úkol
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

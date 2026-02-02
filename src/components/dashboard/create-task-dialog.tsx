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
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  ArrowLeft,
  Brain,
  Instagram,
  Mail,
  LayoutTemplate,
  ChevronRight,
  ExternalLink,
  Github,
  Send,
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
  onSubmit?: (task: TaskFormData, result: TaskResult) => void
}

interface TaskFormData {
  type: TaskType
  title: string
  description: string
  priority: TaskPriority
  clientName: string
  existingUrl?: string
}

interface TaskResult {
  success: boolean
  status: 'completed' | 'needs_input' | 'needs_review' | 'error'
  output?: string
  question?: string
  feedback?: string
  // Web developer specific
  githubUrl?: string
  vercelUrl?: string
  projectName?: string
}

const taskTypes = [
  { value: 'web_development', label: 'Tvorba webu', icon: <Globe className="h-4 w-4 text-indigo-400" />, special: true },
  { value: 'content_creation', label: 'Tvorba obsahu', icon: <FileText className="h-4 w-4 text-blue-400" /> },
  { value: 'seo_audit', label: 'SEO audit', icon: <Search className="h-4 w-4 text-green-400" /> },
  { value: 'competitor_analysis', label: 'Analýza konkurence', icon: <Users className="h-4 w-4 text-purple-400" /> },
  { value: 'ads_campaign', label: 'Reklamní kampaň', icon: <Megaphone className="h-4 w-4 text-orange-400" /> },
  { value: 'social_media', label: 'Social Media', icon: <Instagram className="h-4 w-4 text-pink-400" /> },
  { value: 'email_marketing', label: 'Email Marketing', icon: <Mail className="h-4 w-4 text-emerald-400" /> },
  { value: 'strategy_creation', label: 'Marketingová strategie', icon: <Lightbulb className="h-4 w-4 text-yellow-400" /> },
  { value: 'mvp_creation', label: 'MVP / Prototyp', icon: <Code className="h-4 w-4 text-cyan-400" /> },
  { value: 'client_analysis', label: 'Analýza klienta', icon: <BarChart3 className="h-4 w-4 text-rose-400" /> },
  { value: 'report_generation', label: 'Generování reportu', icon: <Globe className="h-4 w-4 text-indigo-400" /> },
]

const priorities = [
  { value: 'low', label: 'Nízká', color: 'bg-slate-500/20 text-slate-400' },
  { value: 'medium', label: 'Střední', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'high', label: 'Vysoká', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'urgent', label: 'Urgentní', color: 'bg-red-500/20 text-red-400' },
]

type DialogStep = 'templates' | 'form' | 'processing' | 'result'

interface Template {
  id: string
  name: string
  description: string | null
  type: string
  default_title: string | null
  default_description: string | null
  prompt_template: string | null
  default_priority: string
  estimated_duration: number | null
  tags: string[]
  times_used: number
}

export function CreateTaskDialog({ open, onOpenChange, onSubmit }: CreateTaskDialogProps) {
  const [step, setStep] = React.useState<DialogStep>('templates')
  const [formData, setFormData] = React.useState<TaskFormData>({
    type: 'content_creation',
    title: '',
    description: '',
    priority: 'medium',
    clientName: '',
    existingUrl: '',
  })
  const [result, setResult] = React.useState<TaskResult | null>(null)
  const [processingStep, setProcessingStep] = React.useState(0)
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = React.useState(false)
  const [answerText, setAnswerText] = React.useState('')
  const [isAnswering, setIsAnswering] = React.useState(false)

  const processingSteps = [
    'Analyzuji úkol...',
    'Vybírám vhodného agenta...',
    'Agent pracuje...',
    'Supervisor kontroluje výstup...',
  ]

  // Fetch templates when dialog opens
  React.useEffect(() => {
    if (open && templates.length === 0) {
      setLoadingTemplates(true)
      fetch('/api/templates')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTemplates(data.templates)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingTemplates(false))
    }
  }, [open, templates.length])

  const selectTemplate = (template: Template) => {
    setFormData({
      type: template.type as TaskType,
      title: template.default_title || '',
      description: template.prompt_template || template.default_description || '',
      priority: (template.default_priority || 'medium') as TaskPriority,
      clientName: '',
    })
    setStep('form')
  }

  const resetDialog = () => {
    setStep('templates')
    setFormData({
      type: 'content_creation',
      title: '',
      description: '',
      priority: 'medium',
      clientName: '',
      existingUrl: '',
    })
    setResult(null)
    setProcessingStep(0)
    setAnswerText('')
    setIsAnswering(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(resetDialog, 300) // Reset after animation
  }

  // Handle answering agent's question
  const handleAnswer = async () => {
    if (!answerText.trim()) return

    setIsAnswering(true)
    setStep('processing')
    setProcessingStep(0)

    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => Math.min(prev + 1, processingSteps.length - 1))
    }, 1500)

    try {
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: formData.type,
          title: formData.title,
          description: `${formData.description}\n\nDodatečné informace od uživatele:\n${answerText}`,
          clientName: formData.clientName,
          priority: formData.priority,
        }),
      })

      clearInterval(stepInterval)

      const data = await response.json()

      setResult({
        success: data.success,
        status: data.status || (data.success ? 'completed' : 'error'),
        output: data.output,
        question: data.question,
        feedback: data.feedback,
      })

      setStep('result')
      setAnswerText('')
      onSubmit?.(formData, data)
    } catch (error) {
      clearInterval(stepInterval)
      setResult({
        success: false,
        status: 'error',
        output: error instanceof Error ? error.message : 'Neznámá chyba',
      })
      setStep('result')
    } finally {
      setIsAnswering(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setStep('processing')
    setProcessingStep(0)

    // Different processing steps for web development
    const steps = formData.type === 'web_development'
      ? ['Analyzuji zadání...', 'Generuji kód webu...', 'Vytvářím GitHub repo...', 'Nasazuji na Vercel...']
      : processingSteps

    // Simulate processing steps
    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => Math.min(prev + 1, steps.length - 1))
    }, formData.type === 'web_development' ? 3000 : 1500)

    try {
      // Use different endpoint for web development
      const endpoint = formData.type === 'web_development'
        ? '/api/agents/web-developer'
        : '/api/agents/execute'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: formData.type,
          title: formData.title,
          description: formData.description,
          clientName: formData.clientName,
          priority: formData.priority,
          existingUrl: formData.existingUrl,
        }),
      })

      clearInterval(stepInterval)

      const data = await response.json()

      setResult({
        success: data.success,
        status: data.status || (data.success ? 'completed' : 'error'),
        output: data.output,
        question: data.question,
        feedback: data.feedback,
        githubUrl: data.githubUrl,
        vercelUrl: data.vercelUrl,
        projectName: data.projectName,
      })

      setStep('result')
      onSubmit?.(formData, data)
    } catch (error) {
      clearInterval(stepInterval)
      setResult({
        success: false,
        status: 'error',
        output: error instanceof Error ? error.message : 'Neznámá chyba',
      })
      setStep('result')
    }
  }

  const copyToClipboard = () => {
    if (result?.output) {
      navigator.clipboard.writeText(result.output)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn('transition-all duration-300', step === 'result' ? 'max-w-3xl' : step === 'templates' ? 'max-w-2xl' : 'max-w-xl')} onClose={handleClose}>
        {/* TEMPLATES STEP */}
        {step === 'templates' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500">
                  <LayoutTemplate className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle>Nový úkol</DialogTitle>
                  <DialogDescription>Vyber šablonu nebo začni od nuly</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Quick start button */}
              <button
                onClick={() => setStep('form')}
                className="w-full p-4 rounded-xl border border-dashed border-white/20 hover:border-primary/50 hover:bg-white/5 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Začít od nuly</p>
                    <p className="text-sm text-muted-foreground">Vytvoř vlastní úkol bez šablony</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>

              {/* Templates */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Nebo vyber šablonu:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {templates.map((template) => {
                      const typeInfo = taskTypes.find(t => t.value === template.type)
                      return (
                        <button
                          key={template.id}
                          onClick={() => selectTemplate(template)}
                          className="p-3 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all text-left group"
                        >
                          <div className="flex items-start gap-2">
                            {typeInfo?.icon || <FileText className="h-4 w-4 text-muted-foreground" />}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{template.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {template.description}
                              </p>
                              {template.times_used > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Použito {template.times_used}x
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {loadingTemplates && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>
                Zrušit
              </Button>
            </DialogFooter>
          </>
        )}

        {/* FORM STEP */}
        {step === 'form' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('templates')}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
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
                <label className="text-sm font-medium">
                  {formData.type === 'web_development' ? 'Zadání webu' : 'Popis'}
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={formData.type === 'web_development'
                    ? "Popiš, jaký web má agent vytvořit. Např. typ webu, barevné schéma, sekce, funkce..."
                    : "Popiš, co přesně má agent udělat. Čím víc detailů, tím lepší výsledek."
                  }
                  className="min-h-[100px] bg-white/5 border-white/10"
                />
              </div>

              {/* URL for redesign (web development only) */}
              {formData.type === 'web_development' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Současný web <span className="text-muted-foreground">(pro redesign)</span>
                  </label>
                  <Input
                    value={formData.existingUrl}
                    onChange={(e) => setFormData({ ...formData, existingUrl: e.target.value })}
                    placeholder="https://example.cz (nechte prázdné pro nový web)"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              )}

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
                  onClick={handleClose}
                >
                  Zrušit
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.title.trim()}
                  className="gap-2 bg-gradient-to-r from-primary to-violet-500"
                >
                  <Sparkles className="h-4 w-4" />
                  Spustit agenta
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {/* PROCESSING STEP */}
        {step === 'processing' && (
          <div className="py-12">
            <div className="flex flex-col items-center gap-6">
              {/* Animated brain icon */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-violet-500 blur-xl opacity-50 animate-pulse" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500">
                  <Brain className="h-10 w-10 text-white animate-pulse" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Agent pracuje</h3>
                <p className="text-sm text-muted-foreground">
                  {processingSteps[processingStep]}
                </p>
              </div>

              {/* Progress steps */}
              <div className="flex gap-2">
                {processingSteps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 w-8 rounded-full transition-all duration-500',
                      i <= processingStep ? 'bg-primary' : 'bg-white/10'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULT STEP */}
        {step === 'result' && result && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  result.success ? 'bg-emerald-500/20' : 'bg-red-500/20'
                )}>
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div>
                  <DialogTitle>
                    {result.status === 'completed' && 'Úkol dokončen'}
                    {result.status === 'needs_input' && 'Agent má dotaz'}
                    {result.status === 'needs_review' && 'Ke kontrole'}
                    {result.status === 'error' && 'Chyba'}
                  </DialogTitle>
                  <DialogDescription>
                    {formData.title}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Question from agent */}
              {result.status === 'needs_input' && result.question && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-amber-500/20 p-2">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-300">Agent se ptá:</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{result.question}</p>
                      </div>
                    </div>
                  </div>

                  {/* Answer input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vaše odpověď</label>
                    <Textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Zadejte odpověď na otázku agenta..."
                      className="min-h-[100px] bg-white/5 border-white/10"
                    />
                    <Button
                      onClick={handleAnswer}
                      disabled={!answerText.trim() || isAnswering}
                      className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500"
                    >
                      {isAnswering ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Odpovědět a pokračovat
                    </Button>
                  </div>
                </div>
              )}

              {/* Web Development Links */}
              {formData.type === 'web_development' && (result.vercelUrl || result.githubUrl) && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <p className="text-sm font-medium text-emerald-300">Web je připraven!</p>
                  <div className="flex flex-wrap gap-2">
                    {result.vercelUrl && (
                      <a
                        href={result.vercelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Otevřít web
                      </a>
                    )}
                    {result.githubUrl && (
                      <a
                        href={result.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                      >
                        <Github className="h-4 w-4" />
                        GitHub repo
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Output */}
              {result.output && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Výstup agenta</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="gap-2 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      Kopírovat
                    </Button>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 max-h-[400px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{result.output}</pre>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {result.feedback && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-sm font-medium text-blue-300">Poznámka od Supervisora:</p>
                  <p className="text-sm mt-1 text-muted-foreground">{result.feedback}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setStep('form')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Nový úkol
              </Button>
              <Button
                variant="ghost"
                onClick={handleSubmit}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Zkusit znovu
              </Button>
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-primary to-violet-500"
              >
                Hotovo
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

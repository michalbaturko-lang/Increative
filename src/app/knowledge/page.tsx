'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { Badge, Button, Input, Textarea } from '@/components/ui'
import { CreateTaskDialog } from '@/components/dashboard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import {
  BookOpen,
  FileText,
  Lightbulb,
  Code,
  Star,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Copy,
  Sparkles,
  CheckCircle2,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KnowledgeEntry {
  id: string
  type: string
  title: string
  description: string | null
  tags: string[]
  agent_types: string[]
  content: string
  source_task_id: string | null
  created_by: string | null
  times_used: number
  success_rate: number | null
  created_at: string
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  template: {
    label: 'Šablona',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  best_practice: {
    label: 'Best Practice',
    icon: <Star className="h-4 w-4" />,
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  example: {
    label: 'Příklad',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  prompt: {
    label: 'Prompt',
    icon: <Code className="h-4 w-4" />,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  learning: {
    label: 'Naučené',
    icon: <Lightbulb className="h-4 w-4" />,
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
}

const entryTypes = [
  { value: 'template', label: 'Šablona' },
  { value: 'best_practice', label: 'Best Practice' },
  { value: 'example', label: 'Příklad' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'learning', label: 'Naučené' },
]

const agentTypes = [
  { value: 'content_writer', label: 'Content Writer' },
  { value: 'seo_analyst', label: 'SEO Analyst' },
  { value: 'ads_specialist', label: 'Ads Specialist' },
  { value: 'analyst', label: 'Business Analyst' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'email_marketing', label: 'Email Marketing' },
]

export default function KnowledgePage() {
  const [entries, setEntries] = React.useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [filterType, setFilterType] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [newEntry, setNewEntry] = React.useState({
    type: 'template',
    title: '',
    description: '',
    content: '',
    tags: '',
    agent_types: [] as string[],
  })
  const [saving, setSaving] = React.useState(false)

  const fetchEntries = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') {
        params.set('type', filterType)
      }
      if (searchQuery) {
        params.set('search', searchQuery)
      }
      const response = await fetch(`/api/knowledge?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setEntries(data.entries)
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }, [filterType, searchQuery])

  React.useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newEntry.type,
          title: newEntry.title,
          description: newEntry.description || null,
          content: newEntry.content,
          tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
          agent_types: newEntry.agent_types,
          created_by: 'human',
        }),
      })

      const data = await response.json()
      if (data.success) {
        setShowAddDialog(false)
        setNewEntry({
          type: 'template',
          title: '',
          description: '',
          content: '',
          tags: '',
          agent_types: [],
        })
        fetchEntries()
      }
    } catch (error) {
      console.error('Failed to add entry:', error)
    } finally {
      setSaving(false)
    }
  }

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('cs-CZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  return (
    <div className="relative min-h-screen bg-background">
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />

      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header title="Knowledge Base" subtitle="Znalostní báze pro AI agenty" onNewTask={() => setCreateTaskOpen(true)} />
        <main className="p-6 space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hledat v knowledge base..."
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                  <button
                    onClick={() => setFilterType('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filterType === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    )}
                  >
                    Vše
                  </button>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setFilterType(key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        filterType === key
                          ? 'bg-primary text-white'
                          : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                      )}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchEntries}
                className="gap-2"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="gap-2 bg-gradient-to-r from-primary to-violet-500"
              >
                <Plus className="h-4 w-4" />
                Přidat
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(typeConfig).map(([key, config]) => {
              const count = entries.filter(e => e.type === key).length
              return (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={cn(
                    'rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10',
                    filterType === key && 'ring-2 ring-primary'
                  )}
                >
                  <div className={cn('inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium border', config.color)}>
                    {config.icon}
                    {config.label}
                  </div>
                  <p className="mt-2 text-2xl font-bold">{count}</p>
                </button>
              )
            })}
          </div>

          {/* Entries List */}
          <div className="space-y-3">
            {loading && entries.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Načítám znalosti...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Knowledge Base je prázdná</h3>
                <p className="text-muted-foreground mb-4">
                  Přidejte první znalost pro vaše AI agenty.
                </p>
                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Přidat znalost
                </Button>
              </div>
            ) : (
              entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="fade-in rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Entry Header */}
                  <button
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      typeConfig[entry.type]?.color || 'bg-white/10'
                    )}>
                      {typeConfig[entry.type]?.icon || <FileText className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 text-left">
                      <h3 className="font-medium">{entry.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{typeConfig[entry.type]?.label || entry.type}</span>
                        <span>Použito {entry.times_used}x</span>
                        <span>{formatDate(entry.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.tags.slice(0, 3).map(tag => (
                        <Badge
                          key={tag}
                          className="bg-white/10 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {entry.tags.length > 3 && (
                        <Badge className="bg-white/10 text-xs">
                          +{entry.tags.length - 3}
                        </Badge>
                      )}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-muted-foreground transition-transform ml-2',
                          expandedId === entry.id && 'rotate-180'
                        )}
                      />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedId === entry.id && (
                    <div className="border-t border-white/10 p-4 space-y-4">
                      {entry.description && (
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Obsah</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyContent(entry.content)}
                            className="gap-2 text-xs"
                          >
                            <Copy className="h-3 w-3" />
                            Kopírovat
                          </Button>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4 max-h-[300px] overflow-y-auto">
                          <pre className="text-sm whitespace-pre-wrap font-sans">
                            {entry.content}
                          </pre>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Vytvořil: {entry.created_by || 'system'}</span>
                          {entry.agent_types.length > 0 && (
                            <span>Pro: {entry.agent_types.join(', ')}</span>
                          )}
                        </div>
                        {entry.success_rate !== null && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {entry.success_rate}% úspěšnost
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl" onClose={() => setShowAddDialog(false)}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle>Přidat znalost</DialogTitle>
                <DialogDescription>Přidejte novou znalost do knowledge base</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Typ</label>
                <Select
                  value={newEntry.type}
                  onValueChange={(value) => setNewEntry({ ...newEntry, type: value })}
                  options={entryTypes}
                  placeholder="Vyber typ"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pro agenty</label>
                <div className="flex flex-wrap gap-1">
                  {agentTypes.map(agent => (
                    <button
                      key={agent.value}
                      type="button"
                      onClick={() => {
                        const types = newEntry.agent_types.includes(agent.value)
                          ? newEntry.agent_types.filter(t => t !== agent.value)
                          : [...newEntry.agent_types, agent.value]
                        setNewEntry({ ...newEntry, agent_types: types })
                      }}
                      className={cn(
                        'px-2 py-1 rounded-lg text-xs font-medium transition-all border',
                        newEntry.agent_types.includes(agent.value)
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
                      )}
                    >
                      {agent.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Název</label>
              <Input
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="Název znalosti"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Popis <span className="text-muted-foreground">(volitelné)</span></label>
              <Input
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="Krátký popis"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Obsah</label>
              <Textarea
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                placeholder="Obsah znalosti - šablona, best practice, prompt..."
                className="min-h-[150px] bg-white/5 border-white/10 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tagy <span className="text-muted-foreground">(oddělené čárkou)</span></label>
              <Input
                value={newEntry.tags}
                onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                placeholder="seo, content, template"
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleAddEntry}
              disabled={!newEntry.title.trim() || !newEntry.content.trim() || saving}
              className="gap-2 bg-gradient-to-r from-primary to-violet-500"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Uložit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

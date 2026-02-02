'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { Badge, Button, Input } from '@/components/ui'
import { CreateTaskDialog } from '@/components/dashboard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Users,
  Plus,
  Search,
  Building2,
  Globe,
  Mail,
  Phone,
  RefreshCw,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Edit,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'

interface Client {
  id: string
  name: string
  industry: string | null
  website: string | null
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = React.useState<Client[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [newClient, setNewClient] = React.useState({
    name: '',
    industry: '',
    website: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [saving, setSaving] = React.useState(false)

  const canManageClients = user?.role === 'superadmin' || user?.role === 'admin'

  const fetchClients = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleAddClient = async () => {
    if (!newClient.name.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      })

      const data = await response.json()
      if (data.success) {
        setShowAddDialog(false)
        setNewClient({ name: '', industry: '', website: '', email: '', phone: '', notes: '' })
        fetchClients()
      }
    } catch (error) {
      console.error('Failed to add client:', error)
    } finally {
      setSaving(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header title="Klienti" subtitle="Správa klientů agentury" onNewTask={() => setCreateTaskOpen(true)} />
        <main className="p-6 space-y-6">
          {/* Search and Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat klienty..."
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fetchClients}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
              {canManageClients && (
                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Přidat klienta
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Celkem klientů</span>
              </div>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">Odvětví</span>
              </div>
              <p className="text-2xl font-bold">
                {new Set(clients.map(c => c.industry).filter(Boolean)).size}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Tento měsíc</span>
              </div>
              <p className="text-2xl font-bold">
                {clients.filter(c => {
                  const created = new Date(c.created_at)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>

          {/* Clients List */}
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Načítám klienty...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'Žádní klienti nenalezeni' : 'Zatím žádní klienti'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Zkuste upravit vyhledávání.'
                    : 'Přidejte prvního klienta.'}
                </p>
                {canManageClients && !searchQuery && (
                  <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Přidat klienta
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white font-bold">
                      {client.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{client.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {client.industry && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {client.industry}
                          </span>
                        )}
                        {client.website && (
                          <a
                            href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <Globe className="h-3 w-3" />
                            Web
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-sm text-muted-foreground">
                      {formatDate(client.created_at)}
                    </span>

                    {canManageClients && (
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent onClose={() => setShowAddDialog(false)}>
          <DialogHeader>
            <DialogTitle>Nový klient</DialogTitle>
            <DialogDescription>Přidejte nového klienta do systému</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Název *</label>
              <Input
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                placeholder="Název společnosti"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Odvětví</label>
                <Input
                  value={newClient.industry}
                  onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                  placeholder="např. E-commerce"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Web</label>
                <Input
                  value={newClient.website}
                  onChange={(e) => setNewClient({ ...newClient, website: e.target.value })}
                  placeholder="www.example.cz"
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="kontakt@example.cz"
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon</label>
                <Input
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="+420 xxx xxx xxx"
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleAddClient}
              disabled={!newClient.name.trim() || saving}
              className="gap-2"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Přidat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

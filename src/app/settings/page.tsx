'use client'

import * as React from 'react'
import { Sidebar, Header } from '@/components/layout'
import { Button, Input, Badge } from '@/components/ui'
import { CreateTaskDialog } from '@/components/dashboard'
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Save,
  RefreshCw,
  CheckCircle2,
  Moon,
  Sun,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'
import { roleLabels, roleColors } from '@/lib/auth'

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth()
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [profile, setProfile] = React.useState({
    full_name: '',
    email: '',
  })

  React.useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        email: user.email,
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          full_name: profile.full_name,
        }),
      })

      if (response.ok) {
        await refreshProfile()
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    {
      id: 'profile',
      title: 'Profil',
      icon: <User className="h-5 w-5" />,
      description: 'Vaše osobní údaje a nastavení účtu',
    },
    {
      id: 'notifications',
      title: 'Notifikace',
      icon: <Bell className="h-5 w-5" />,
      description: 'Nastavení upozornění a emailů',
    },
    {
      id: 'appearance',
      title: 'Vzhled',
      icon: <Palette className="h-5 w-5" />,
      description: 'Téma a zobrazení aplikace',
    },
    {
      id: 'security',
      title: 'Bezpečnost',
      icon: <Shield className="h-5 w-5" />,
      description: 'Heslo a dvoufaktorové ověření',
    },
  ]

  const [activeSection, setActiveSection] = React.useState('profile')

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
        <Header title="Nastavení" subtitle="Správa účtu a preferencí" onNewTask={() => setCreateTaskOpen(true)} />
        <main className="p-6">
          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <div className="w-64 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                    activeSection === section.id
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  )}
                >
                  {section.icon}
                  <div>
                    <p className="font-medium">{section.title}</p>
                    <p className={cn(
                      'text-xs',
                      activeSection === section.id ? 'text-white/70' : 'text-muted-foreground'
                    )}>
                      {section.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 max-w-2xl">
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-lg font-semibold mb-6">Osobní údaje</h2>

                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl font-bold text-white">
                        {profile.full_name
                          ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : profile.email.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{profile.full_name || 'Bez jména'}</h3>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        {user?.role && (
                          <Badge className={cn('mt-2 text-xs border', roleColors[user.role])}>
                            {roleLabels[user.role]}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Celé jméno</label>
                        <Input
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          placeholder="Vaše jméno"
                          className="bg-white/5 border-white/10"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          value={profile.email}
                          disabled
                          className="bg-white/5 border-white/10 opacity-50"
                        />
                        <p className="text-xs text-muted-foreground">Email nelze změnit</p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="gap-2"
                      >
                        {saving ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : saved ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {saved ? 'Uloženo' : 'Uložit změny'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold mb-6">Nastavení notifikací</h2>

                  <div className="space-y-4">
                    {[
                      { label: 'Email při dokončení úkolu', enabled: true },
                      { label: 'Email při otázce agenta', enabled: true },
                      { label: 'Týdenní souhrn', enabled: false },
                      { label: 'Novinky a aktualizace', enabled: false },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/10">
                        <span>{item.label}</span>
                        <button
                          className={cn(
                            'relative h-6 w-11 rounded-full transition-colors',
                            item.enabled ? 'bg-primary' : 'bg-white/20'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
                              item.enabled ? 'left-6' : 'left-1'
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold mb-6">Vzhled aplikace</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-3 block">Téma</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/10">
                          <Moon className="h-5 w-5" />
                          <span>Tmavé</span>
                          <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />
                        </button>
                        <button className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-white/20">
                          <Sun className="h-5 w-5" />
                          <span>Světlé</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-3 block">Jazyk</label>
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10">
                        <Globe className="h-5 w-5" />
                        <span>Čeština</span>
                        <Badge className="ml-auto bg-white/10">Výchozí</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold mb-6">Bezpečnost</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Změna hesla</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Pro změnu hesla vám pošleme email s odkazem.
                      </p>
                      <Button variant="outline" className="gap-2">
                        <Key className="h-4 w-4" />
                        Změnit heslo
                      </Button>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                      <h3 className="font-medium mb-2">Dvoufaktorové ověření</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Přidejte další vrstvu zabezpečení k vašemu účtu.
                      </p>
                      <Button variant="outline" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Nastavit 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

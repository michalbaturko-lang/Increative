'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar, Header } from '@/components/layout'
import { Badge, Button } from '@/components/ui'
import { Select } from '@/components/ui/select'
import {
  Users,
  Shield,
  ShieldCheck,
  User,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'
import { roleLabels, roleColors, type UserRole } from '@/lib/auth'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  can_create_tasks: boolean
  can_manage_clients: boolean
  can_manage_knowledge: boolean
  can_view_analytics: boolean
  can_manage_users: boolean
  created_at: string
  updated_at: string
}

const roleOptions = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'project_manager', label: 'Projektový manažer' },
]

const roleIcons: Record<UserRole, React.ReactNode> = {
  superadmin: <ShieldCheck className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  project_manager: <User className="h-4 w-4" />,
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [users, setUsers] = React.useState<UserProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState<string | null>(null)

  // Check permission
  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      router.push('/')
    }
  }, [currentUser, router])

  const fetchUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const updateUserRole = async (userId: string, role: UserRole) => {
    setSaving(userId)
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          role,
          // Update permissions based on role
          can_manage_clients: role === 'superadmin' || role === 'admin',
          can_manage_knowledge: role === 'superadmin' || role === 'admin',
          can_view_analytics: role === 'superadmin' || role === 'admin',
          can_manage_users: role === 'superadmin',
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? data.user : u))
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    } finally {
      setSaving(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('cs-CZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  // Don't render for non-superadmins
  if (currentUser && currentUser.role !== 'superadmin') {
    return null
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="relative pl-64">
        <Header title="Uživatelé" subtitle="Správa uživatelů a rolí" />
        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {(['superadmin', 'admin', 'project_manager'] as UserRole[]).map((role) => {
              const count = users.filter(u => u.role === role).length
              return (
                <div
                  key={role}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium border mb-2',
                    roleColors[role]
                  )}>
                    {roleIcons[role]}
                    {roleLabels[role]}
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              )
            })}
          </div>

          {/* Users List */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Všichni uživatelé</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchUsers}
                className="gap-2"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Načítám uživatele...
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Zatím žádní uživatelé
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.full_name || 'Bez jména'}</h3>
                        {user.id === currentUser?.id && (
                          <Badge className="bg-primary/20 text-primary text-xs">Vy</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="flex items-center gap-2">
                      {user.can_manage_clients && (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center" title="Může spravovat klienty">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        </div>
                      )}
                      {user.can_view_analytics && (
                        <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center" title="Může zobrazit analytiku">
                          <CheckCircle2 className="h-3 w-3 text-blue-400" />
                        </div>
                      )}
                    </div>

                    {/* Role Selector */}
                    <div className="w-48">
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value as UserRole)}
                        options={roleOptions}
                        disabled={saving === user.id || user.id === currentUser?.id}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Role Explanation */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold mb-4">Role a oprávnění</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className={cn('inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium border mb-2', roleColors.superadmin)}>
                  {roleIcons.superadmin}
                  Super Admin
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Plný přístup ke všemu</li>
                  <li>Správa uživatelů a rolí</li>
                  <li>Nastavení systému</li>
                </ul>
              </div>
              <div>
                <div className={cn('inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium border mb-2', roleColors.admin)}>
                  {roleIcons.admin}
                  Admin
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Správa klientů</li>
                  <li>Knowledge Base</li>
                  <li>Analytika</li>
                </ul>
              </div>
              <div>
                <div className={cn('inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium border mb-2', roleColors.project_manager)}>
                  {roleIcons.project_manager}
                  Projektový manažer
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Vytváření úkolů</li>
                  <li>Práce s agenty</li>
                  <li>Vlastní historie</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

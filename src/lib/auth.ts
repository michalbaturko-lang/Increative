import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'superadmin' | 'admin' | 'project_manager'

export interface UserProfile {
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

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get current user's profile
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as UserProfile
}

// Check if user has permission
export function hasPermission(profile: UserProfile | null, permission: keyof UserProfile): boolean {
  if (!profile) return false

  // Superadmin has all permissions
  if (profile.role === 'superadmin') return true

  // Admin has most permissions except user management
  if (profile.role === 'admin' && permission !== 'can_manage_users') {
    return true
  }

  return profile[permission] as boolean
}

// Check if user has role
export function hasRole(profile: UserProfile | null, roles: UserRole[]): boolean {
  if (!profile) return false
  return roles.includes(profile.role)
}

// Role labels
export const roleLabels: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  project_manager: 'Projektový manažer',
}

// Role colors
export const roleColors: Record<UserRole, string> = {
  superadmin: 'bg-red-500/20 text-red-400 border-red-500/30',
  admin: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  project_manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase, getCurrentProfile, type UserProfile } from '@/lib/auth'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshProfile: async () => {},
})

export function useAuth() {
  return React.useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refreshProfile = React.useCallback(async () => {
    const profile = await getCurrentProfile()
    setUser(profile)
  }, [])

  React.useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const profile = await getCurrentProfile()
        setUser(profile)

        // Redirect to login if not authenticated and not already on login page
        if (!profile && pathname !== '/login') {
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const profile = await getCurrentProfile()
          setUser(profile)
          if (pathname === '/login') {
            router.push('/')
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router, refreshProfile])

  // Show nothing while checking auth on protected routes
  if (loading && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Načítám...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

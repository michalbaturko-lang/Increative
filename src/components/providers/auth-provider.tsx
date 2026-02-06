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
  const [loading, setLoading] = React.useState(false) // Start with false - no auth required
  const router = useRouter()
  const pathname = usePathname()

  const refreshProfile = React.useCallback(async () => {
    try {
      const profile = await getCurrentProfile()
      setUser(profile)
    } catch {
      // Ignore auth errors - auth is optional
    }
  }, [])

  React.useEffect(() => {
    // Try to get profile but don't block if not authenticated
    const checkSession = async () => {
      try {
        const profile = await getCurrentProfile()
        setUser(profile)
      } catch {
        // Auth is optional - just continue without user
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
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router, refreshProfile])

  // No loading state - render children immediately
  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

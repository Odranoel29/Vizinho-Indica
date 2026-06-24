import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export interface UsuarioProfile {
  id: number
  nome_completo: string
  bio: string
  avatar_url: string
  email?: string
  whatsapp?: string
  is_admin?: boolean
  tipo?: 'morador' | 'prestador'
  prestador_aprovado?: boolean
  prestador_expiracao?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UsuarioProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UsuarioProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (currentUser: User) => {
    try {
      // Busca pelo email na tabela usuarios
      let { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle()

      // Fallback: se não achar por email, tenta buscar por ID
      if (!data || error) {
        const { data: idData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle()
        if (idData) {
          data = idData
        }
      }

      if (data) {
        setProfile(data as UsuarioProfile)
      } else {
        // Fallback perfil local caso o trigger no DB ainda não tenha rodado
        setProfile({
          id: 9999,
          nome_completo: currentUser.user_metadata?.nome_completo || currentUser.email?.split('@')[0] || 'Vizinho',
          bio: 'Olá! Sou morador do condomínio.',
          avatar_url: currentUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
          email: currentUser.email,
          tipo: 'morador',
          prestador_aprovado: false
        })
      }
    } catch (e) {
      console.error('Erro ao buscar perfil:', e)
    }
  }

  useEffect(() => {
    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user).then(() => setLoading(false))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true)
        await fetchProfile(session.user)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Lock, Mail, User, Phone, Image, ArrowRight, Sparkles } from 'lucide-react'

export const Auth: React.FC = () => {
  const { session } = useAuth()
  const navigate = useNavigate()
  
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  React.useEffect(() => {
    if (session) {
      navigate('/')
    }
  }, [session, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (isRegister) {
        // Validação de senha
        if (password.length < 8) {
          setErrorMsg('A senha deve ter no mínimo 8 caracteres.')
          setLoading(false)
          return
        }

        // Fluxo de Cadastro
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome_completo: nomeCompleto,
              avatar_url: avatarUrl || undefined
            }
          }
        })

        if (authError) throw authError

        if (authData?.user) {
          // Cria o registro na tabela usuarios
          const { error: userTableError, status } = await supabase
            .from('usuarios')
            .insert({
              nome_completo: nomeCompleto,
              email: email,
              bio: 'Olá! Sou morador do condomínio.',
              avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
              whatsapp: whatsapp || null
            })

          // Se falhar (coluna id não é auto-increment), tenta com ID gerado
          if (userTableError && status !== 201) {
            const { error: retryError } = await supabase
              .from('usuarios')
              .insert({
                id: Date.now(),
                nome_completo: nomeCompleto,
                email: email,
                bio: 'Olá! Sou morador do condomínio.',
                avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
                whatsapp: whatsapp || null
              })
            if (retryError) {
              console.error('Erro ao salvar na tabela usuarios (com ID):', retryError)
            }
          }

          if (userTableError) {
            console.error('Erro ao salvar na tabela usuarios:', userTableError)
          }

          setSuccessMsg('Cadastro realizado com sucesso! Faça o login abaixo.')
          setIsRegister(false)
        }
      } else {
        // Fluxo de Login
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (loginError) throw loginError
        navigate('/')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro no processamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-[85vh]">
      <div className="bg-white rounded-3xl-cozy shadow-sm border border-slate-100 p-8 max-w-md w-full flex flex-col gap-6">
        
        {/* Cabeçalho */}
        <div className="text-center flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-2xl-cozy cozy-button-gradient flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles size={20} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-800 mt-2">
            {isRegister ? 'Criar nova conta' : 'Acesse sua conta'}
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-[280px] mx-auto">
            {isRegister 
              ? 'Conecte-se com vizinhos de confiança no condomínio' 
              : 'Entre para indicar e contratar serviços locais'}
          </p>
        </div>

        {/* Mensagens de Feedback */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-xs font-semibold p-3.5 rounded-xl-cozy border border-red-100">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-3.5 rounded-xl-cozy border border-emerald-100">
            {successMsg}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isRegister && (
            <>
              {/* Nome Completo */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Whatsapp */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Whatsapp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    placeholder="Ex: 11999999999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Avatar URL */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Foto de Perfil (URL)</label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="url"
                    placeholder="Ex: https://link.com/foto.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                required
                placeholder="nome@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider pl-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                required
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl-cozy border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-xs bg-slate-50/50"
              />
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3.5 rounded-2xl-cozy shadow-xs shadow-emerald-500/10 hover:shadow-md transition-all duration-300 cozy-button-gradient hover:scale-102 active:scale-98 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            {loading ? 'Processando...' : isRegister ? 'Confirmar Cadastro' : 'Entrar na Plataforma'}
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <hr className="border-slate-100" />

        {/* Alternância Login/Cadastro */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister)
              setErrorMsg('')
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {isRegister 
              ? 'Já tem uma conta? Faça login aqui' 
              : 'Não tem conta? Cadastre-se na vizinhança'}
          </button>
        </div>

      </div>
    </div>
  )
}
export default Auth;

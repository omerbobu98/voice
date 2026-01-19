import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../lib/translations'
import { LanguageToggle } from '../components/LanguageToggle'
import { Phone, Mail, Lock, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const { language, dir } = useLanguage()
  const T = (key) => t(key, language)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(T('auth.passwordsNoMatch'))
      return
    }

    if (password.length < 6) {
      setError(T('auth.passwordTooShort'))
      return
    }

    setLoading(true)

    const { data, error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // If email confirmation is disabled, redirect to app
      if (data.session) {
        navigate('/app')
      }
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6" dir={dir}>
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{T('auth.checkEmail')}</h2>
            <p className="text-gray-400 mb-6">
              {T('auth.confirmationSent')} <span className="text-white">{email}</span>. 
              {T('auth.clickToActivate')}
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-violet-500/20 text-violet-400 rounded-xl font-medium hover:bg-violet-500/30 transition-colors"
            >
              {T('auth.goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6" dir={dir}>
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <LanguageToggle compact />
        </div>
        
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
              <h1 className="text-2xl font-bold text-white">SalesAI</h1>
              <p className="text-xs text-gray-500">{T('landing.conversationIntelligence')}</p>
            </div>
          </Link>
        </div>

        {/* Register Card */}
        <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-bold text-white text-center mb-2">{T('auth.createAccount')}</h2>
          <p className="text-gray-500 text-center mb-8">{T('auth.startFreeTrial')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{T('auth.email')}</label>
              <div className="relative">
                <Mail className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors`}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{T('auth.password')}</label>
              <div className="relative">
                <Lock className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500`} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{T('auth.confirmPassword')}</label>
              <div className="relative">
                <Lock className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500`} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-white/5 border border-white/10 rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {T('auth.creatingAccount')}
                </>
              ) : (
                T('auth.createAccount')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#12121a] text-gray-500">{T('auth.orContinueWith')}</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full bg-white text-gray-800 py-3 px-8 rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 border border-white/20"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {T('auth.connecting')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {T('auth.continueWithGoogle')}
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-500">
              {T('auth.haveAccount')}{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">
                {T('auth.signIn')}
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-500 hover:text-gray-400 text-sm">
            {T('auth.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

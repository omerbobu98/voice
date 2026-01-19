import { useLanguage } from '../contexts/LanguageContext'
import { Globe } from 'lucide-react'

export function LanguageToggle({ className = '', compact = false }) {
  const { language, toggleLanguage } = useLanguage()

  if (compact) {
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all ${className}`}
        title={language === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
      >
        <span className="text-sm font-medium text-gray-300">
          {language === 'en' ? 'עב' : 'EN'}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all ${className}`}
      title={language === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
    >
      <Globe className="w-4 h-4 text-gray-400" />
      <span className="text-sm font-medium text-gray-300">
        {language === 'en' ? 'EN' : 'עברית'}
      </span>
      <span className="text-xs text-gray-500">|</span>
      <span className="text-sm font-medium text-violet-400">
        {language === 'en' ? 'עברית' : 'EN'}
      </span>
    </button>
  )
}

export function LanguageToggleMinimal({ className = '' }) {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        language === 'en' 
          ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30' 
          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
      } ${className}`}
    >
      {language === 'en' ? 'EN → עב' : 'עב → EN'}
    </button>
  )
}

export default LanguageToggle

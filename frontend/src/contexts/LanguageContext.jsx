import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

const STORAGE_KEY = 'salesai-language'

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'en'
    }
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    // Update document direction for RTL support
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'he' : 'en')
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    isHebrew: language === 'he',
    isEnglish: language === 'en',
    dir: language === 'he' ? 'rtl' : 'ltr'
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext

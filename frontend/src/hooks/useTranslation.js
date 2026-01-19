import { useLanguage } from '../contexts/LanguageContext'
import { t as translate } from '../lib/translations'

export function useTranslation() {
  const { language, isHebrew, isEnglish, dir, toggleLanguage } = useLanguage()

  const t = (key) => translate(key, language)

  return {
    t,
    language,
    isHebrew,
    isEnglish,
    dir,
    toggleLanguage,
  }
}

export default useTranslation

import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import de from './locales/de.json'
import it from './locales/it.json'
import fr from './locales/fr.json'
import zh from './locales/zh.json'
import ru from './locales/ru.json'

// ─── Supported languages ───────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'zh', label: '中文',     flag: '🇨🇳' },
  { code: 'ru', label: 'Русский',  flag: '🇷🇺' },
]

// ─── Per-user language persistence ────────────────────────────────────────────
// Stored as  i18n_lang:<username>  so each user keeps their own preference.
// Falls back to browser language, then English.

export function getUserLang(username) {
  if (username) {
    const saved = localStorage.getItem('i18n_lang:' + username)
    if (saved && LANGUAGES.some(l => l.code === saved)) return saved
  }
  const browser = navigator.language?.split('-')[0]
  if (browser && LANGUAGES.some(l => l.code === browser)) return browser
  return 'en'
}

export function setUserLang(username, code) {
  if (username) localStorage.setItem('i18n_lang:' + username, code)
}

// Login page always starts in English; the user's preference is applied
// after login via AuthContext → getUserLang().
function getInitialLang() {
  return 'en'
}

// ─── i18next initialisation ────────────────────────────────────────────────────
i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      it: { translation: it },
      fr: { translation: fr },
      zh: { translation: zh },
      ru: { translation: ru },
    },
    lng: getInitialLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18next

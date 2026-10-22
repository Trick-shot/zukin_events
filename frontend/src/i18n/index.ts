import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import sw from './sw.json'

export const SUPPORTED_LANGUAGES = ['en', 'sw'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sw: { translation: sw },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    // The venue is in Tanzania but the design ships EN first and the Swahili
    // copy is an unreviewed draft, so a browser set to sw-TZ should still land
    // on English until the client has signed the translation off.
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'htmlTag'],
      lookupLocalStorage: 'zukin-lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

// Keep <html lang> in sync so screen readers switch pronunciation.
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export default i18n

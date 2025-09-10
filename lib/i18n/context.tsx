"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { defaultLocale, locales, languageNames } from "./config"
import { translations } from "./translations"
import { useApiStore } from "@/lib/api-store"

interface I18nContextType {
  locale: string
  setLocale: (locale: string) => void
  t: (key: string) => string
  languageNames: { [key: string]: string }
  locales: string[]
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { preferences, updatePreferences } = useApiStore()
  const [locale, setLocaleState] = useState<string>(defaultLocale)

  useEffect(() => {
    if (preferences?.language && preferences.language !== locale) {
      setLocaleState(preferences.language)
    }
  }, [preferences?.language, locale])

  const setLocale = async (newLocale: string) => {
    if (locales.includes(newLocale)) {
      setLocaleState(newLocale)
      if (preferences?.language !== newLocale) {
        await updatePreferences({ language: newLocale as "en" | "fr" })
      }
    } else {
      console.warn(`Locale "${newLocale}" is not supported.`)
    }
  }

  const t = (key: string): string => {
    const currentTranslations = (translations as any)[locale] || (translations as any)[defaultLocale]
    return currentTranslations[key] || key
  }

  const contextValue: I18nContextType = {
    locale,
    setLocale,
    t,
    languageNames,
    locales,
  }

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

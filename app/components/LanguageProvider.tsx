"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type Language = "ko" | "en"

interface LanguageContextValue {
  readonly language: Language
  readonly setLanguage: (language: Language) => void
  readonly toggleLanguage: () => void
}

const LANGUAGE_STORAGE_KEY = "terra.language"
const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { readonly children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ko")

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === "ko" || stored === "en") setLanguage(stored)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language === "ko" ? "ko" : "en"
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, toggleLanguage: () => setLanguage((current) => current === "ko" ? "en" : "ko") }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext)
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider")
  return value
}

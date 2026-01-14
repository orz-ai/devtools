"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Locale, translations } from '@/lib/i18n'

interface I18nContextType {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('zh')

    // Load locale from localStorage on mount
    useEffect(() => {
        const savedLocale = localStorage.getItem('locale') as Locale
        if (savedLocale && (savedLocale === 'zh' || savedLocale === 'en')) {
            setLocaleState(savedLocale)
        }
    }, [])

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale)
        localStorage.setItem('locale', newLocale)
    }

    const t = (key: string): string => {
        const keys = key.split('.')
        let value: any = translations[locale]

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k]
            } else {
                console.warn(`Translation key not found: ${key}`)
                return key
            }
        }

        return typeof value === 'string' ? value : key
    }

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider')
    }
    return context
}

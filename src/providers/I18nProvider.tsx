'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import { detectLocale } from '@/lib/detectLocale';

// Re-export so the rest of the app imports Locale from one place
export type { Locale } from '@/lib/detectLocale';
import type { Locale } from '@/lib/detectLocale';

import ptMessages from '@/messages/pt.json';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';
import frMessages from '@/messages/fr.json';

const MESSAGES: Record<Locale, AbstractIntlMessages> = {
  pt: ptMessages as AbstractIntlMessages,
  en: enMessages as AbstractIntlMessages,
  es: esMessages as AbstractIntlMessages,
  fr: frMessages as AbstractIntlMessages,
};

const STORAGE_KEY = 'formfit_locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
});

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
  initialMessages?: AbstractIntlMessages;
}

export function I18nProvider({
  children,
  initialLocale = 'en',
  initialMessages,
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Hydrate on mount:
  // 1. localStorage (manual choice or previous auto-detect)
  // 2. navigator.language (auto-detect)
  // 3. 'en' (fallback — already set via initialLocale default)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && saved in MESSAGES) {
        setLocaleState(saved);
        return;
      }
      // No saved preference — detect from browser
      const detected = detectLocale(navigator.language ?? 'en');
      setLocaleState(detected);
      localStorage.setItem(STORAGE_KEY, detected);
    } catch {}
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try { localStorage.setItem(STORAGE_KEY, newLocale); } catch {}
  }, []);

  const messages = MESSAGES[locale] ?? initialMessages ?? (ptMessages as AbstractIntlMessages);

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}

export function useLocale(): I18nContextValue {
  return useContext(I18nContext);
}

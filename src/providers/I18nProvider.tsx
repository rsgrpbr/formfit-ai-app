'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import type { AbstractIntlMessages } from 'next-intl';

import ptMessages from '@/messages/pt.json';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';
import frMessages from '@/messages/fr.json';

export type Locale = 'pt' | 'en' | 'es' | 'fr';

const MESSAGES: Record<Locale, AbstractIntlMessages> = {
  pt: ptMessages as AbstractIntlMessages,
  en: enMessages as AbstractIntlMessages,
  es: esMessages as AbstractIntlMessages,
  fr: frMessages as AbstractIntlMessages,
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'pt',
  setLocale: () => {},
});

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
  initialMessages?: AbstractIntlMessages;
}

export function I18nProvider({
  children,
  initialLocale = 'pt',
  initialMessages,
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('formfit_locale') as Locale | null;
      if (saved && saved in MESSAGES) setLocaleState(saved);
    } catch {}
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try { localStorage.setItem('formfit_locale', newLocale); } catch {}
  }, []);

  const messages = MESSAGES[locale] ?? initialMessages ?? ptMessages as AbstractIntlMessages;

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

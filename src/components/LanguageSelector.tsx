'use client';

import { useLocale } from '@/providers/I18nProvider';
import type { Locale } from '@/providers/I18nProvider';
import { updateProfile } from '@/lib/supabase/queries';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const LOCALES: { code: Locale; flag: string; label: string }[] = [
  { code: 'pt', flag: '🇧🇷', label: 'PT' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
];

export function LanguageSelector({ userId }: { userId?: string }) {
  const { locale, setLocale } = useLocale();
  const t = useTranslations('language');

  const handleChange = async (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocale(newLocale);
    if (userId) {
      await updateProfile(userId, { locale: newLocale });
      toast.success(t('saved'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{t('label')}:</span>
      <div className="flex gap-1">
        {LOCALES.map(({ code, flag, label }) => (
          <button
            key={code}
            onClick={() => handleChange(code)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all
              ${locale === code
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            {flag} {label}
          </button>
        ))}
      </div>
    </div>
  );
}

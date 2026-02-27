'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { useLocale } from '@/providers/I18nProvider';
import type { Locale } from '@/providers/I18nProvider';
import { LanguageSelector } from '@/components/LanguageSelector';
import { updateProfile } from '@/lib/supabase/queries';

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings');
  const { user, profile, loading } = useSession();
  const { locale, setLocale } = useLocale();

  const [name,          setName]          = useState('');
  const [saving,        setSaving]        = useState(false);
  const [gender,        setGender]        = useState<'male' | 'female'>('male');
  const [savingGender,  setSavingGender]  = useState(false);

  // Sync locale from profile on first load
  useEffect(() => {
    if (profile?.locale && profile.locale !== locale) {
      setLocale(profile.locale as Locale);
    }
  }, [profile?.locale]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  // Pre-fill name and gender from profile
  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
  }, [profile?.full_name]);

  useEffect(() => {
    if (profile?.gender) setGender(profile.gender);
  }, [profile?.gender]);

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const ok = await updateProfile(user.id, { full_name: name.trim() });
    setSaving(false);
    if (ok) toast.success(t('saved'));
  };

  const handleGenderSelect = async (value: 'male' | 'female') => {
    if (!user || value === gender) return;
    setGender(value);
    setSavingGender(true);
    await updateProfile(user.id, { gender: value });
    setSavingGender(false);
    toast.success(t('saved'));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">FormFit AI</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/analyze" className="min-h-[48px] flex items-center px-2 text-gray-400 hover:text-white transition-colors">
            {t('train')}
          </Link>
          <Link href="/dashboard" className="min-h-[48px] flex items-center px-2 text-gray-400 hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 pb-24 max-w-xl mx-auto w-full space-y-4">

        {/* Page title */}
        <h1 className="text-2xl font-black">⚙️ {t('title')}</h1>

        {/* ── Seção: Idioma ── */}
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300">{t('language_section')}</h2>
          </div>
          <div className="px-5 py-4">
            <LanguageSelector userId={user.id} />
          </div>
        </section>

        {/* ── Seção: Conta ── */}
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300">{t('account_section')}</h2>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                {t('name_label')}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                placeholder={t('name_placeholder')}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                  placeholder-gray-600 focus:outline-none focus:border-indigo-500
                  focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <button
              onClick={handleSaveName}
              disabled={saving || !name.trim()}
              className="w-full py-3 min-h-[48px] rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm
                transition-transform duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </section>

        {/* ── Seção: Avatar ── */}
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300">{t('avatar_section')}</h2>
          </div>
          <div className="px-5 py-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              {t('gender_label')}
            </p>
            <div className="flex gap-3">
              {(['male', 'female'] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => handleGenderSelect(val)}
                  disabled={savingGender}
                  className="flex-1 py-3 min-h-[48px] rounded-xl text-sm font-semibold
                    border-2 transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style={{
                    background: '#0F1419',
                    borderColor: gender === val ? '#C8F135' : '#1E2A35',
                    color: gender === val ? '#C8F135' : '#9CA3AF',
                  }}
                >
                  {val === 'male' ? t('gender_male') : t('gender_female')}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* E-mail (read-only) */}
        <section className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">E-mail</p>
            <p className="text-sm text-gray-300">{user.email}</p>
          </div>
        </section>

      </main>
    </div>
  );
}

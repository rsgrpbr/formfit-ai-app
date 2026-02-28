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
import { updateProfile } from '@/lib/supabase/queries';
import { LogOut, Trash2, Zap } from 'lucide-react';

// ── Static maps ───────────────────────────────────────────────────────────────

const AVATAR_BG = [
  'bg-indigo-600', 'bg-purple-600', 'bg-rose-600',
  'bg-amber-600',  'bg-teal-600',   'bg-cyan-600',
];

const PLAN_STYLE: Record<string, string> = {
  free:     'bg-gray-700/60 text-gray-300',
  pro:      'bg-indigo-900/60 text-indigo-300',
  personal: 'bg-amber-900/60 text-amber-300',
  annual:   'bg-green-900/60 text-green-300',
};

const LOCALES: { code: Locale; flag: string; label: string }[] = [
  { code: 'pt', flag: '🇧🇷', label: 'PT' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
];

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const t    = useTranslations('profile');
  const tOb  = useTranslations('onboarding');
  const router = useRouter();
  const { user, profile, loading, signOut } = useSession();
  const { locale, setLocale } = useLocale();

  // ── Section 1 state ────────────────────────────────────────────────────────
  const [name,         setName]         = useState('');
  const [savingName,   setSavingName]   = useState(false);

  // ── Section 2 state ────────────────────────────────────────────────────────
  const [obj,             setObj]             = useState('');
  const [lev,             setLev]             = useState('');
  const [days,            setDays]            = useState<number | null>(null);
  const [loc,             setLoc]             = useState('');
  const [savingObjective, setSavingObjective] = useState(false);
  const [regenerating,    setRegenerating]    = useState(false);

  // ── Section 3 state ────────────────────────────────────────────────────────
  const [gender,        setGender]        = useState<'male' | 'female'>('male');
  const [voiceEnabled,  setVoiceEnabled]  = useState(true);
  const [savingGender,  setSavingGender]  = useState(false);
  const [savingVoice,   setSavingVoice]   = useState(false);

  // ── Section 4 state ────────────────────────────────────────────────────────
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [deletingAccount,  setDeletingAccount]  = useState(false);

  // ── Sync from profile ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); }
  }, [loading, user, router]);

  useEffect(() => {
    if (!profile) return;
    if (profile.full_name)    setName(profile.full_name);
    if (profile.objective)    setObj(profile.objective);
    if (profile.level)        setLev(profile.level);
    if (profile.days_per_week) setDays(profile.days_per_week);
    if (profile.location)     setLoc(profile.location);
    if (profile.gender)       setGender(profile.gender);
    setVoiceEnabled(profile.voice_coach_enabled ?? true);
  }, [profile]);

  // ── Section 1: save name ───────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    await updateProfile(user.id, { full_name: name.trim() });
    setSavingName(false);
    toast.success(t('saved'));
  };

  // ── Section 2: save objective + regenerate plan ────────────────────────────
  const handleSaveObjective = async () => {
    if (!user) return;
    setSavingObjective(true);
    await updateProfile(user.id, {
      objective:    obj    || null,
      level:        lev    || null,
      days_per_week: days,
      location:     loc    || null,
    });
    setSavingObjective(false);

    if (obj && lev && days && loc) {
      setRegenerating(true);
      try {
        await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, objective: obj, level: lev, days_per_week: days, location: loc }),
        });
        toast.success(t('plan_regen_ok'));
      } catch {
        toast.success(t('saved'));
      } finally {
        setRegenerating(false);
      }
    } else {
      toast.success(t('saved'));
    }
  };

  // ── Section 3: voice + gender + locale ────────────────────────────────────
  const handleVoiceToggle = async () => {
    if (!user || savingVoice) return;
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    setSavingVoice(true);
    await updateProfile(user.id, { voice_coach_enabled: next });
    setSavingVoice(false);
  };

  const handleGenderSelect = async (val: 'male' | 'female') => {
    if (!user || val === gender || savingGender) return;
    setGender(val);
    setSavingGender(true);
    await updateProfile(user.id, { gender: val });
    setSavingGender(false);
    toast.success(t('saved'));
  };

  const handleLocaleChange = async (code: Locale) => {
    if (code === locale) return;
    setLocale(code);
    if (user) await updateProfile(user.id, { locale: code });
    toast.success(t('saved'));
  };

  // ── Section 4: sign out + delete ──────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleDeleteAccount = async () => {
    if (!user || deletingAccount) return;
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' });
      if (res.ok) {
        await signOut();
        router.replace('/login');
      } else {
        toast.error('Erro ao excluir conta.');
        setDeletingAccount(false);
        setShowDeleteModal(false);
      }
    } catch {
      toast.error('Erro ao excluir conta.');
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials   = getInitials(profile?.full_name ?? null, user.email ?? '');
  const avatarBg   = AVATAR_BG[(user.email ?? '').charCodeAt(0) % AVATAR_BG.length];
  const planKey    = profile?.plan ?? 'free';
  const planLabel  = t(planKey as 'free' | 'pro' | 'personal' | 'annual');
  const planStyle  = PLAN_STYLE[planKey] ?? PLAN_STYLE.free;

  const OBJECTIVES = [
    { value: 'emagrecer',       icon: '🔥', label: tOb('obj_lose_weight') },
    { value: 'ganhar_massa',    icon: '💪', label: tOb('obj_gain_muscle') },
    { value: 'definir',         icon: '✂️', label: tOb('obj_tone') },
    { value: 'condicionamento', icon: '🏃', label: tOb('obj_conditioning') },
  ];

  const LEVELS = [
    { value: 'iniciante',     label: tOb('level_beginner') },
    { value: 'intermediario', label: tOb('level_intermediate') },
    { value: 'avancado',      label: tOb('level_advanced') },
  ];

  const LOCATIONS = [
    { value: 'casa',     icon: '🏠', label: tOb('loc_home') },
    { value: 'academia', icon: '🏋️', label: tOb('loc_gym') },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col pb-28">

      <header className="px-4 pt-5 pb-3 border-b border-gray-800">
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 max-w-xl mx-auto w-full">

        {/* ══ SEÇÃO 1 — MINHA CONTA ═══════════════════════════════════════ */}
        <Section title={t('section_account')}>

          {/* Avatar + name row */}
          <div className="flex items-center gap-4 mb-5">
            <div className={`${avatarBg} w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black flex-shrink-0`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">
                {profile?.full_name || user.email}
              </p>
              <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1 ${planStyle}`}>
                {planLabel}
              </span>
            </div>
          </div>

          {/* Name field */}
          <div className="space-y-2 mb-3">
            <label className="text-xs text-gray-400 uppercase tracking-wider">{t('name_label')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              placeholder={t('name_placeholder')}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleSaveName}
              disabled={savingName || !name.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm
                transition-all active:scale-95 disabled:opacity-50"
            >
              {savingName ? t('saving') : t('save_name')}
            </button>
          </div>

          {/* Email (read-only) */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('email_label')}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>

          {/* Upgrade CTA — only for free users */}
          {planKey === 'free' && (
            <Link
              href="/pricing"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl
                bg-[#C8F135]/10 border border-[#C8F135]/30 text-[#C8F135] font-semibold text-sm
                hover:bg-[#C8F135]/20 transition-colors"
            >
              <Zap size={15} />
              {t('upgrade_btn')}
            </Link>
          )}
        </Section>

        {/* ══ SEÇÃO 2 — MEU OBJETIVO ══════════════════════════════════════ */}
        <Section title={t('section_objective')}>

          {/* Objetivo */}
          <SubLabel>{t('obj_label')}</SubLabel>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {OBJECTIVES.map(({ value, icon, label }) => (
              <Pill key={value} active={obj === value} onClick={() => setObj(value)}>
                {icon} {label}
              </Pill>
            ))}
          </div>

          {/* Nível */}
          <SubLabel>{t('level_label')}</SubLabel>
          <div className="flex gap-2 mb-4">
            {LEVELS.map(({ value, label }) => (
              <Pill key={value} active={lev === value} onClick={() => setLev(value)} className="flex-1">
                {label}
              </Pill>
            ))}
          </div>

          {/* Dias por semana */}
          <SubLabel>{t('days_label')}</SubLabel>
          <div className="flex gap-2 mb-4">
            {[3, 4, 5, 6].map(d => (
              <Pill key={d} active={days === d} onClick={() => setDays(d)} className="flex-1">
                {d}x
              </Pill>
            ))}
          </div>

          {/* Local */}
          <SubLabel>{t('location_label')}</SubLabel>
          <div className="flex gap-2 mb-5">
            {LOCATIONS.map(({ value, icon, label }) => (
              <Pill key={value} active={loc === value} onClick={() => setLoc(value)} className="flex-1">
                {icon} {label}
              </Pill>
            ))}
          </div>

          <button
            onClick={handleSaveObjective}
            disabled={savingObjective || regenerating}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm
              transition-all active:scale-95 disabled:opacity-50"
          >
            {regenerating ? t('regenerating') : savingObjective ? t('saving') : t('save_objective')}
          </button>
        </Section>

        {/* ══ SEÇÃO 3 — PREFERÊNCIAS ══════════════════════════════════════ */}
        <Section title={t('section_prefs')}>

          {/* Idioma */}
          <div className="mb-5">
            <SubLabel>{t('language_label')}</SubLabel>
            <div className="flex gap-2 mt-2">
              {LOCALES.map(({ code, flag, label }) => (
                <button
                  key={code}
                  onClick={() => handleLocaleChange(code)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border-2
                    ${locale === code
                      ? 'border-indigo-500 bg-indigo-900/40 text-indigo-300'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'}`}
                >
                  {flag} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Voz do instrutor */}
          <div className="flex items-center justify-between py-3 border-t border-gray-800 mb-3">
            <div>
              <p className="text-sm font-medium">{t('voice_label')}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {voiceEnabled ? t('voice_on') : t('voice_off')}
              </p>
            </div>
            <button
              onClick={handleVoiceToggle}
              disabled={savingVoice}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200
                ${voiceEnabled ? 'bg-[#C8F135]' : 'bg-gray-600'}`}
              aria-label={voiceEnabled ? t('voice_on') : t('voice_off')}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                ${voiceEnabled ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Gênero do avatar */}
          <div className="border-t border-gray-800 pt-3">
            <SubLabel>{t('gender_label')}</SubLabel>
            <div className="flex gap-2 mt-2">
              {(['male', 'female'] as const).map(val => (
                <button
                  key={val}
                  onClick={() => handleGenderSelect(val)}
                  disabled={savingGender}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 disabled:opacity-50"
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
        </Section>

        {/* ══ SEÇÃO 4 — CONTA ════════════════════════════════════════════ */}
        <Section title={t('section_danger')}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white
              font-semibold text-sm transition-all active:scale-95"
          >
            <LogOut size={16} />
            {t('sign_out')}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-400
              border border-red-900/50 font-semibold text-sm transition-all active:scale-95"
          >
            <Trash2 size={16} />
            {t('delete_account')}
          </button>
        </Section>

      </main>

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2 text-white">{t('delete_confirm_title')}</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">{t('delete_confirm_desc')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
              >
                {t('delete_cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {deletingAccount ? '…' : t('delete_confirm_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-gray-900 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{children}</p>
  );
}

function Pill({
  active, onClick, children, className = '',
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95
        ${active
          ? 'border-indigo-500 bg-indigo-900/40 text-indigo-300'
          : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'}
        ${className}`}
    >
      {children}
    </button>
  );
}

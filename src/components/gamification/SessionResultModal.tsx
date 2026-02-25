'use client';

import { useTranslations } from 'next-intl';
import type { GamificationResult, GamificationLevel } from '@/types/gamification';

// ── Constantes de nível ───────────────────────────────────────────────────────

const LEVEL_STARTS: Record<GamificationLevel, number> = {
  'Iniciante':     0,
  'Intermediário': 500,
  'Avançado':      1500,
  'Elite':         3000,
};

const LEVEL_ENDS: Record<GamificationLevel, number> = {
  'Iniciante':     500,
  'Intermediário': 1500,
  'Avançado':      3000,
  'Elite':         Infinity,
};

// ── Barra de progresso ────────────────────────────────────────────────────────

function XpProgressBar({ level, totalXp }: { level: GamificationLevel; totalXp: number }) {
  const start = LEVEL_STARTS[level];
  const end   = LEVEL_ENDS[level];

  if (end === Infinity) {
    return (
      <div className="w-full h-2 rounded-full bg-gray-700">
        <div className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 w-full" />
      </div>
    );
  }

  const pct = Math.min(100, Math.round(((totalXp - start) / (end - start)) * 100));
  return (
    <div className="w-full h-2 rounded-full bg-gray-700 overflow-hidden">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface SessionResultModalProps {
  result: GamificationResult;
  onClose: () => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function SessionResultModal({ result, onClose }: SessionResultModalProps) {
  const t = useTranslations('modal');

  const {
    xpEarned,
    newTotalXp,
    newLevel,
    previousLevel,
    leveledUp,
    earnedBadges,
    streakDays,
    streakBonus,
  } = result;

  const nextLevel =
    newLevel === 'Iniciante'     ? 'Intermediário' :
    newLevel === 'Intermediário' ? 'Avançado'      :
                                   'Elite';

  return (
    <div className="bg-gray-900 rounded-2xl p-6 max-w-xs mx-4 w-full shadow-2xl flex flex-col gap-4">

      {/* Banner de level up */}
      {leveledUp && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl p-3 text-center">
          <p className="text-yellow-400 font-bold text-xs uppercase tracking-widest">
            Level Up! 🎉
          </p>
          <p className="text-white text-lg font-black mt-0.5">
            {previousLevel} → {newLevel}
          </p>
        </div>
      )}

      {/* XP ganho */}
      <div className="text-center">
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">{t('xp_earned')}</p>
        <p className="text-5xl font-black text-indigo-400">+{xpEarned}</p>
      </div>

      {/* Streak */}
      {streakDays > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span>🔥</span>
          <span className="text-gray-300">
            {t('streak_label')}:{' '}
            <span className="text-white font-semibold">
              {streakDays} dia{streakDays !== 1 ? 's' : ''}
            </span>
          </span>
          {streakBonus && (
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
              +30 XP
            </span>
          )}
        </div>
      )}

      {/* Barra de progresso */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{newLevel}</span>
          <span>{newTotalXp.toLocaleString()} XP</span>
        </div>
        <XpProgressBar level={newLevel} totalXp={newTotalXp} />
        {newLevel !== 'Elite' && (
          <p className="text-right text-xs text-gray-500">
            {t('xp_to_level', {
              xp:    (LEVEL_ENDS[newLevel] - newTotalXp).toLocaleString(),
              level: nextLevel,
            })}
          </p>
        )}
      </div>

      {/* Badges desbloqueados */}
      {earnedBadges.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
            {earnedBadges.length > 1 ? t('badges_unlocked') : t('badge_unlocked')}
          </p>
          <div className="flex flex-col gap-2">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 bg-gray-800 rounded-xl p-3"
              >
                <span className="text-2xl shrink-0">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{badge.name}</p>
                  <p className="text-gray-400 text-xs truncate">{badge.description}</p>
                </div>
                <span className="text-indigo-400 text-xs font-bold shrink-0">
                  +{badge.xp_reward} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão fechar */}
      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95"
      >
        {t('continue')}
      </button>
    </div>
  );
}

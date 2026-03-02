'use client';

import { useSession } from '@/hooks/useSession';
import { getSubscriptionStatus } from '@/lib/subscription';

const PLANS = {
  mensal: process.env.NEXT_PUBLIC_CARTPANDA_MENSAL ||
    'https://rsgroup.mycartpanda.com/checkout/208184469:1',
  trimestral: process.env.NEXT_PUBLIC_CARTPANDA_TRIMESTRAL ||
    'https://rsgroup.mycartpanda.com/checkout/208184474:1',
  anual: process.env.NEXT_PUBLIC_CARTPANDA_ANUAL ||
    'https://rsgroup.mycartpanda.com/checkout/208184481:1',
};

console.log('[Paywall] PLANS:', PLANS);

interface PaywallProps {
  onClose?: () => void;
}

export default function Paywall({ onClose }: PaywallProps) {
  const { profile } = useSession();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as Record<string, any> | null;

  // Treat null trial_expires_at as still-active trial
  const trialExpiresAt: string =
    p?.trial_expires_at ?? new Date(Date.now() + 86_400_000).toISOString();

  const status = p
    ? getSubscriptionStatus({
        is_pro: Boolean(p.is_pro),
        trial_expires_at: trialExpiresAt,
        pro_expires_at: (p.pro_expires_at as string | null) ?? null,
      })
    : 'trial';

  console.log('[Paywall] status:', status, 'email:', p?.email ?? 'anon');

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm px-4 overflow-y-auto"
    >
      <div className="w-full max-w-sm py-8 space-y-3">

        {/* Header */}
        <div className="text-center mb-6">
          <p
            className="font-display text-4xl tracking-widest"
            style={{ color: 'var(--accent)' }}
          >
            meMove PRO
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {status === 'expired'
              ? 'Seu trial expirou. Escolha um plano para continuar.'
              : 'Desbloqueie acesso ilimitado.'}
          </p>
        </div>

        {/* Mensal */}
        <PlanCard
          href={PLANS.mensal}
          label="MENSAL"
          price="R$ 29,90"
          period="por mês"
          highlight={false}
        />

        {/* Trimestral */}
        <PlanCard
          href={PLANS.trimestral}
          label="TRIMESTRAL"
          price="R$ 19,90"
          period="por mês · cobrado a cada 3 meses"
          highlight
          badge="POPULAR"
        />

        {/* Anual */}
        <PlanCard
          href={PLANS.anual}
          label="ANUAL"
          price="R$ 9,90"
          period="por mês · cobrado anualmente"
          highlight={false}
          badge="MELHOR CUSTO"
        />

        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-3 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Continuar grátis
          </button>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  href,
  label,
  price,
  period,
  highlight,
  badge,
}: {
  href: string;
  label: string;
  price: string;
  period: string;
  highlight: boolean;
  badge?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-5 py-4 rounded-2xl border transition-all active:scale-95 relative overflow-hidden block"
      style={{
        background: highlight ? 'rgba(200,241,53,0.10)' : 'var(--surface)',
        borderColor: highlight ? 'var(--accent)' : 'var(--border)',
      }}
    >
      {badge && (
        <span
          className="absolute top-2 right-3 text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          {badge}
        </span>
      )}
      <div>
        <p
          className="font-display text-[10px] tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>
        <p className="font-display text-2xl tracking-wide text-white">{price}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {period}
        </p>
      </div>
      <span
        className="font-display text-sm tracking-widest px-4 py-2 rounded-xl flex-shrink-0"
        style={{
          background: highlight ? 'var(--accent)' : 'var(--surface2)',
          color: highlight ? 'var(--bg)' : 'var(--text)',
        }}
      >
        ASSINAR
      </span>
    </a>
  );
}

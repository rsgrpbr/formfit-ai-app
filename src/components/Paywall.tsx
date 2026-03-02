'use client';

import { useSession } from '@/hooks/useSession';
import { getSubscriptionStatus } from '@/lib/subscription';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  badge: string | null;
  features: string[];
  url: string;
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'mensal',
    name: 'PRO Mensal',
    price: 'R$19,90',
    period: '/mês',
    badge: null,
    features: [
      '30 exercícios em casa',
      'Análise de forma com IA',
      'Plano personalizado',
      'Feedback por voz',
      'Histórico completo',
    ],
    url: 'https://rsgroup.mycartpanda.com/checkout/208184469:1',
    highlight: false,
  },
  {
    id: 'anual',
    name: 'PRO Anual',
    price: 'R$149',
    period: '/ano',
    badge: '38% OFF',
    features: [
      'Tudo do PRO Mensal',
      '2 meses grátis',
      'Desafio 21 dias incluso',
      'E-book Detox incluso',
      'Plano Alimentar IA incluso',
    ],
    url: 'https://rsgroup.mycartpanda.com/checkout/208184481:1',
    highlight: true,
  },
  {
    id: 'trimestral',
    name: 'PRO Trimestral',
    price: 'R$37,90',
    period: '/trimestre',
    badge: null,
    features: [
      'Tudo do PRO Mensal',
      '~R$12,63/mês',
      'Sem compromisso anual',
    ],
    url: 'https://rsgroup.mycartpanda.com/checkout/208184474:1',
    highlight: false,
  },
];

console.log('[Paywall] PLANS:', PLANS.map(p => ({ id: p.id, url: p.url })));

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm px-4 overflow-y-auto">
      <div className="w-full max-w-sm py-8 space-y-3">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="font-display text-4xl tracking-widest" style={{ color: 'var(--accent)' }}>
            meMove PRO
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {status === 'expired'
              ? 'Seu trial expirou. Escolha um plano para continuar.'
              : 'Desbloqueie acesso ilimitado.'}
          </p>
        </div>

        {/* Plan cards */}
        {PLANS.map(plan => (
          <PlanCard key={plan.id} plan={plan} />
        ))}

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

function PlanCard({ plan }: { plan: Plan }) {
  const handleClick = () => {
    window.open(plan.url, '_blank');
  };

  return (
    <div
      className="rounded-2xl border px-5 py-4 relative overflow-hidden"
      style={{
        background: plan.highlight ? 'rgba(200,241,53,0.08)' : 'var(--surface)',
        borderColor: plan.highlight ? 'var(--accent)' : 'var(--border)',
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <span
          className="absolute top-3 right-3 text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          {plan.badge}
        </span>
      )}

      {/* Name + price */}
      <p className="font-display text-[10px] tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>
        {plan.name.toUpperCase()}
      </p>
      <p className="font-display text-3xl tracking-wide text-white">
        {plan.price}
        <span className="text-base font-sans ml-1" style={{ color: 'var(--text-muted)' }}>
          {plan.period}
        </span>
      </p>

      {/* Features */}
      <ul className="mt-3 mb-4 space-y-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent)' }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <button
        onClick={handleClick}
        className="w-full h-12 rounded-xl font-display tracking-widest text-sm transition-all active:scale-95"
        style={plan.highlight
          ? { background: 'var(--accent)', color: 'var(--bg)' }
          : { background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }
        }
      >
        {plan.highlight ? 'ASSINAR ANUAL — MELHOR OFERTA' : 'Assinar agora'}
      </button>
    </div>
  );
}

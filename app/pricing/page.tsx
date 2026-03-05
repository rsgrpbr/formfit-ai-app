'use client';

import Link from 'next/link';
import { useSession } from '@/hooks/useSession';

interface Plan {
  name: string;
  price: string;
  period: string;
  badge: string | null;
  highlight: boolean;
  features: string[];
  url: string;
}

const PLANS: Plan[] = [
  {
    name: 'PRO Mensal',
    price: 'R$19,90',
    period: '/mês',
    badge: null,
    highlight: false,
    features: [
      '30 exercícios em casa',
      'Análise de forma com IA',
      'Plano personalizado',
      'Feedback por voz',
      'Histórico completo',
    ],
    url: 'https://rsgroup.mycartpanda.com/checkout/208184469:1',
  },
  {
    name: 'PRO Anual',
    price: 'R$149',
    period: '/ano',
    badge: '38% OFF — MAIS POPULAR',
    highlight: true,
    features: [
      'Tudo do PRO Mensal',
      '2 meses grátis',
      'Desafio 21 dias incluso',
      'E-book Detox incluso',
      'Plano Alimentar IA incluso',
    ],
    url: 'https://rsgroup.mycartpanda.com/checkout/208184481:1',
  },
  {
    name: 'PRO Trimestral',
    price: 'R$37,90',
    period: '/trimestre',
    badge: null,
    highlight: false,
    features: [
      'Tudo do PRO Mensal',
      '~R$12,63/mês',
      'Sem compromisso anual',
    ],
    url: 'https://rsgroup.mycartpanda.com/checkout/208184474:1',
  },
];

function PlanCard({
  plan,
  onSubscribe,
}: {
  plan: Plan;
  onSubscribe: (url: string) => void;
}) {
  return (
    <div
      className="relative flex flex-col rounded-2xl px-6 py-6 h-full"
      style={{
        background: plan.highlight ? 'rgba(200,241,53,0.08)' : 'var(--surface)',
        border: `1px solid ${plan.highlight ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {plan.badge && (
        <span
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wide whitespace-nowrap"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          {plan.badge}
        </span>
      )}

      <p
        className="font-display text-xs tracking-widest mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {plan.name.toUpperCase()}
      </p>

      <div className="mb-5">
        <span className="font-display text-4xl text-white">{plan.price}</span>
        <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>
          {plan.period}
        </span>
      </div>

      <ul className="flex flex-col gap-2 mb-6 flex-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <span style={{ color: 'var(--accent)' }}>✓</span>
            <span style={{ color: 'var(--text-muted)' }}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(plan.url)}
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

export default function PricingPage() {
  const { user } = useSession();

  const handleSubscribe = (url: string) => {
    const emailParam = user?.email
      ? `&email=${encodeURIComponent(user.email)}`
      : '';
    window.open(`${url}${emailParam}`, '_blank');
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'var(--bg)' }}>
      <header
        className="px-5 border-b flex items-center justify-between"
        style={{ height: '56px', borderColor: 'var(--border)' }}
      >
        <Link href="/">
          <img src="/icons/icon-192.png" alt="meMove" className="h-8 w-auto" />
        </Link>
        <Link
          href="/analyze"
          className="text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Voltar ao treino
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1
            className="font-display text-5xl tracking-widest mb-2"
            style={{ color: 'var(--accent)' }}
          >
            meMove PRO
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Acesso ilimitado a todos os recursos. Cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
          {PLANS.map(plan => (
            <PlanCard key={plan.name} plan={plan} onSubscribe={handleSubscribe} />
          ))}
        </div>

        <p className="text-center text-sm mt-8" style={{ color: 'var(--text-muted)' }}>
          Pagamento seguro via CartPanda · Cancele quando quiser · Sem multa
        </p>
      </div>
    </div>
  );
}

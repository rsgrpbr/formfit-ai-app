'use client';

import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { redirectToCheckout } from '@/lib/perfectpay';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface PlanCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  planKey?: string;
  userId?: string;
  popular?: boolean;
  isFree?: boolean;
  badge?: string;
}

// ── Dados dos planos ──────────────────────────────────────────────────────────

const PLAN_LIST: PlanCardProps[] = [
  {
    title:   'Free',
    price:   'R$ 0',
    period:  'para sempre',
    isFree:  true,
    features: [
      '5 análises por mês',
      '4 exercícios',
      'Feedback visual em tempo real',
      'Histórico básico',
    ],
  },
  {
    title:   'Pro Mensal',
    price:   'R$ 29,90',
    period:  '/mês',
    planKey: 'pro_mensal',
    popular: true,
    features: [
      'Análises ilimitadas',
      'Todos os exercícios',
      'Feedback por voz (ElevenLabs)',
      'Histórico completo',
      'Export CSV',
    ],
  },
  {
    title:   'Pro Anual',
    price:   'R$ 199',
    period:  '/ano',
    planKey: 'pro_anual',
    badge:   '44% OFF',
    features: [
      'Tudo do Pro Mensal',
      '2 meses grátis',
      'Suporte prioritário',
      'Análise avançada',
    ],
  },
  {
    title:   'Personal Mensal',
    price:   'R$ 79,90',
    period:  '/mês',
    planKey: 'personal_mensal',
    features: [
      'Tudo do Pro',
      'Gerenciar até 30 alunos',
      'Dashboard do professor',
      'Relatórios por aluno',
      'Suporte prioritário',
    ],
  },
  {
    title:   'Personal Anual',
    price:   'R$ 599',
    period:  '/ano',
    planKey: 'personal_anual',
    badge:   '37% OFF',
    features: [
      'Tudo do Personal Mensal',
      '2 meses grátis',
      'Acesso antecipado a novos exercícios',
    ],
  },
];

// ── Card ──────────────────────────────────────────────────────────────────────

function PlanCard({ title, price, period, features, planKey, userId, popular = false, isFree = false, badge }: PlanCardProps) {
  return (
    <div className={`relative flex flex-col rounded-2xl p-6 h-full
      ${popular ? 'bg-indigo-600 ring-2 ring-indigo-400 shadow-xl shadow-indigo-900/40' : 'bg-gray-900'}`}
    >
      {popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-black rounded-full uppercase tracking-wide whitespace-nowrap">
          Mais popular
        </span>
      )}
      {badge && (
        <span className="absolute -top-3.5 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
          {badge}
        </span>
      )}

      <h3 className="text-lg font-bold mb-1">{title}</h3>

      <div className="mb-6 mt-2">
        <span className="text-4xl font-black">{price}</span>
        <span className={`text-sm ml-1 ${popular ? 'text-indigo-200' : 'text-gray-400'}`}>{period}</span>
      </div>

      <ul className="flex flex-col gap-2 mb-8 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <span className={`mt-0.5 font-bold ${popular ? 'text-yellow-300' : 'text-green-400'}`}>✓</span>
            <span className={popular ? 'text-indigo-100' : 'text-gray-300'}>{f}</span>
          </li>
        ))}
      </ul>

      {isFree ? (
        <Link
          href="/analyze"
          className={`block text-center py-3 rounded-xl font-semibold transition-all
            ${popular ? 'bg-white text-indigo-700 hover:bg-gray-100' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
        >
          Começar grátis
        </Link>
      ) : (
        <button
          onClick={() => planKey && userId && redirectToCheckout(planKey, userId)}
          disabled={!userId || !planKey}
          className={`py-3 rounded-xl font-semibold transition-all active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${popular ? 'bg-white text-indigo-700 hover:bg-gray-100' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
        >
          {userId ? 'Assinar agora' : 'Faça login para assinar'}
        </button>
      )}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { user } = useSession();
  const uid      = user?.id;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">FormFit AI</Link>
        <Link href="/analyze" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          ← Voltar ao treino
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-3">Escolha seu plano</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Comece grátis e faça upgrade quando precisar de mais análises e recursos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-start">
          {PLAN_LIST.map(plan => (
            <PlanCard key={plan.title} {...plan} userId={uid} />
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-10">
          Pagamento seguro via PerfectPay · Cancele quando quiser · Sem multa
        </p>
      </div>
    </div>
  );
}

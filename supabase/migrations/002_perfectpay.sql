-- =============================================
-- FormFit AI — Migração PerfectPay
-- =============================================

-- Adiciona coluna perfectpay_code na subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS perfectpay_code text;

-- Atualiza check de plan em profiles para incluir 'personal'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'pro', 'personal', 'annual'));

-- Atualiza check de plan em subscriptions para incluir 'personal'
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'pro', 'personal', 'annual'));

-- Atualiza check de status para incluir 'cancelled' (PerfectPay)
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'canceled', 'cancelled', 'past_due', 'trialing', 'incomplete'));

-- Índice para lookup por perfectpay_code
CREATE INDEX IF NOT EXISTS idx_subscriptions_pp_code
  ON public.subscriptions(perfectpay_code)
  WHERE perfectpay_code IS NOT NULL;

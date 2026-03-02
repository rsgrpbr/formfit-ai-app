export type SubscriptionStatus = 'pro' | 'trial' | 'expired';

export function getSubscriptionStatus(profile: {
  is_pro: boolean;
  trial_expires_at: string;
  pro_expires_at: string | null;
}): SubscriptionStatus {
  const now = new Date();

  if (profile.is_pro && profile.pro_expires_at) {
    if (new Date(profile.pro_expires_at) > now) return 'pro';
  }

  if (new Date(profile.trial_expires_at) > now) return 'trial';

  return 'expired';
}

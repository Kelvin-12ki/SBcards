import { useState, useEffect } from 'react';
import { getSubscription, type SubscriptionInfo } from '@/api/payments';

const PLAN_LEVELS: Record<string, number> = { free: 0, pro: 1, organization: 2 };

export function usePlan() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscription()
      .then(setSubscription)
      .catch(() => setSubscription({ plan: 'free', status: 'none', cancelAtPeriodEnd: false, trialUsed: false }))
      .finally(() => setLoading(false));
  }, []);

  const plan = subscription?.plan || 'free';
  const level = PLAN_LEVELS[plan] || 0;

  const hasPlan = (required: 'free' | 'pro' | 'organization') => {
    return level >= (PLAN_LEVELS[required] || 0);
  };

  return { subscription, plan, loading, hasPlan };
}

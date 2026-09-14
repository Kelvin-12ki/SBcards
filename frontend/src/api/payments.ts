import apiClient from './client';

export interface SubscriptionInfo {
  plan: 'free' | 'pro' | 'organization';
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialUsed: boolean;
}

export async function getSubscription(): Promise<SubscriptionInfo> {
  const { data } = await apiClient.get('/payments/subscription');
  return data;
}

export async function createCheckout(plan: 'pro' | 'organization', billing: 'monthly' | 'annual' = 'monthly'): Promise<{ url: string }> {
  const { data } = await apiClient.post('/payments/checkout', { plan, billing });
  return data;
}

export async function createPortal(): Promise<{ url: string }> {
  const { data } = await apiClient.post('/payments/portal');
  return data;
}

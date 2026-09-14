import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlan } from '@/hooks/usePlan';
import { createCheckout, createPortal } from '@/api/payments';
import { useAuth } from '@/auth/useAuth';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { CrownIcon, ExternalLinkIcon, CheckIcon } from 'lucide-react';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Personal',
    price: 'Free',
    features: ['1 digital card', 'QR sharing', 'Wallet', 'Event check-in'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$9/mo',
    features: ['Unlimited cards', 'AI Match', 'Insights', 'Messaging', 'Exhibitor directory'],
  },
  {
    id: 'organization' as const,
    name: 'Organization',
    price: '$24/mo',
    features: ['Everything in Pro', 'Organizer portal', 'Table seating', 'Event analytics', 'Branded templates'],
  },
];

const BillingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { plan, subscription, loading } = usePlan();
  const { token } = useAuth();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Auto-trigger checkout if ?plan= was passed (e.g. from landing page CTA)
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && (planParam === 'pro' || planParam === 'organization') && !loading && plan === 'free') {
      handleUpgrade(planParam);
    }
  }, [searchParams, loading, plan]);

  const handleUpgrade = async (targetPlan: 'pro' | 'organization') => {
    setUpgrading(targetPlan);
    try {
      const { url } = await createCheckout(targetPlan);
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start checkout');
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await createPortal();
      window.location.href = url;
    } catch (err: any) {
      toast.error('Failed to open billing portal');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-extrabold text-text-primary">Billing & Subscription</h1>
      <p className="mt-2 text-text-secondary">Manage your plan and payment method.</p>

      {/* Current plan banner */}
      <div className="mt-8 rounded-2xl border border-border-subtle bg-surface-1 p-6">
        <div className="flex items-center gap-3">
          <CrownIcon className="h-5 w-5 text-neon-cyan" />
          <div>
            <p className="text-sm text-text-secondary">Current plan</p>
            <p className="text-lg font-bold text-text-primary capitalize">{plan}</p>
          </div>
          {subscription?.status === 'trialing' && (
            <span className="ml-auto rounded-full bg-neon-cyan/10 border border-neon-cyan/30 px-3 py-1 text-xs font-bold text-neon-cyan">
              Free trial
            </span>
          )}
          {subscription?.cancelAtPeriodEnd && (
            <span className="ml-auto rounded-full bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 text-xs font-bold text-yellow-500">
              Cancels {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'soon'}
            </span>
          )}
        </div>

        {plan !== 'free' && (
          <Button variant="secondary" size="sm" className="mt-4" onClick={handleManageBilling}>
            <ExternalLinkIcon className="h-4 w-4 mr-1" />
            Manage billing
          </Button>
        )}
      </div>

      {/* Plan cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === plan;
          const canUpgrade = !isCurrent && PLANS.indexOf(p as any) > PLANS.findIndex((x) => x.id === plan);

          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 ${
                isCurrent
                  ? 'border-neon-cyan/40 bg-neon-cyan/5'
                  : 'border-border-subtle bg-surface-1'
              }`}
            >
              <h3 className="font-bold text-text-primary">{p.name}</h3>
              <p className="mt-1 text-2xl font-extrabold text-text-primary">{p.price}</p>

              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckIcon className="h-3.5 w-3.5 text-neon-cyan shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="mt-4 rounded-lg bg-neon-cyan/10 py-2 text-center text-xs font-bold text-neon-cyan">
                  Current plan
                </div>
              ) : canUpgrade ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4 w-full"
                  loading={upgrading === p.id}
                  onClick={() => handleUpgrade(p.id as 'pro' | 'organization')}
                >
                  Upgrade to {p.name}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BillingPage;

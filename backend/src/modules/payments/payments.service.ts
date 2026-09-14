import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { Subscription, SubscriptionDocument, PlanTier } from './entities/subscription.entity';
import { User, UserDocument } from '../users/entities/user.entity';

const PLAN_PRICE_MAP: Record<string, { monthly: string; annual: string }> = {
  pro: { monthly: 'pro_monthly', annual: 'pro_annual' },
  organization: { monthly: 'org_monthly', annual: 'org_annual' },
};

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Subscription.name) private readonly subModel: Model<SubscriptionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  /** Get or create a Stripe customer for a user. */
  async getOrCreateCustomer(user: UserDocument): Promise<Stripe.Customer> {
    if (user.stripeCustomerId) {
      return this.stripe.customers.retrieve(user.stripeCustomerId) as Promise<Stripe.Customer>;
    }

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.displayName || undefined,
      metadata: { userId: user._id.toString() },
    });

    await this.userModel.findByIdAndUpdate(user._id, {
      stripeCustomerId: customer.id,
    });

    return customer;
  }

  /** Create a Stripe Checkout session for upgrading to Pro or Organization. */
  async createCheckoutSession(
    userId: string,
    plan: Exclude<PlanTier, 'free'>,
    billing: 'monthly' | 'annual' = 'monthly',
  ): Promise<{ url: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new Error('User not found');

    const customer = await this.getOrCreateCustomer(user);

    const priceKey = `${plan === 'pro' ? 'pro' : 'org'}_${billing}`;
    const priceId = this.config.get<string>(`STRIPE_PRICE_${priceKey.toUpperCase()}`);

    if (!priceId) {
      throw new Error(`Stripe price ID not configured for ${priceKey}`);
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'https://sbcards.vercel.app';

    const session = await this.stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/dashboard?upgraded=${plan}`,
      cancel_url: `${frontendUrl}/dashboard?canceled=1`,
      metadata: { userId: userId.toString(), plan },
      subscription_data: {
        trial_period_days: plan === 'pro' ? 14 : 0,
        metadata: { userId: userId.toString(), plan },
      },
    });

    return { url: session.url! };
  }

  /** Create a Stripe Billing Portal session so users can manage their subscription. */
  async createPortalSession(userId: string): Promise<{ url: string }> {
    const user = await this.userModel.findById(userId);
    if (!user?.stripeCustomerId) throw new Error('No billing account found');

    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'https://sbcards.vercel.app';

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl}/dashboard`,
    });

    return { url: session.url };
  }

  /** Handle Stripe webhook events. */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.syncFromCheckout(session);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.syncFromSubscription(subscription);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        this.logger.log(`Invoice paid: ${invoice.id} for customer ${invoice.customer}`);
        break;
      }
      default:
        this.logger.debug(`Unhandled webhook event: ${event.type}`);
    }
  }

  private async syncFromCheckout(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as PlanTier;
    if (!userId || !plan) return;

    const subscriptionId = session.subscription as string;
    if (subscriptionId) {
      const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
      await this.upsertSubscription(userId, plan, sub);
    } else {
      // Free plan (no subscription)
      await this.setFreePlan(userId);
    }
  }

  private async syncFromSubscription(stripeSub: Stripe.Subscription) {
    const userId = stripeSub.metadata?.userId;
    const plan = stripeSub.metadata?.plan as PlanTier;
    if (!userId || !plan) {
      // Try to find user by customer ID
      const customer = await this.stripe.customers.retrieve(stripeSub.customer as string);
      const custEmail = (customer as Stripe.Customer).email;
      if (custEmail) {
        const user = await this.userModel.findOne({ email: custEmail });
        if (user) {
          const status = this.mapStripeStatus(stripeSub.status);
          await this.subModel.findOneAndUpdate(
            { userId: user._id },
            { status, stripeSubscriptionId: stripeSub.id, plan: 'pro' },
            { upsert: true },
          );
          await this.userModel.findByIdAndUpdate(user._id, { plan: 'pro' });
        }
      }
      return;
    }

    await this.upsertSubscription(userId, plan, stripeSub);
  }

  private async upsertSubscription(userId: string, plan: PlanTier, stripeSub: Stripe.Subscription) {
    const status = this.mapStripeStatus(stripeSub.status);

    await this.subModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        plan,
        status,
        stripeCustomerId: stripeSub.customer as string,
        stripeSubscriptionId: stripeSub.id,
        stripePriceId: stripeSub.items.data[0]?.price?.id,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        trialUsed: true,
      },
      { upsert: true },
    );

    await this.userModel.findByIdAndUpdate(userId, { plan });
    this.logger.log(`Subscription synced for user ${userId}: plan=${plan}, status=${status}`);
  }

  private async setFreePlan(userId: string) {
    await this.subModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { plan: 'free', status: 'none' },
      { upsert: true },
    );
    await this.userModel.findByIdAndUpdate(userId, { plan: 'free' });
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): string {
    const map: Record<string, string> = {
      active: 'active',
      trialing: 'trialing',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'past_due',
      incomplete: 'none',
      incomplete_expired: 'none',
      paused: 'past_due',
    };
    return map[status] || 'none';
  }

  /** Get the current subscription for a user. */
  async getSubscription(userId: string) {
    return this.subModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  /** Verify a Stripe webhook signature. */
  verifyWebhookSignature(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')!;
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

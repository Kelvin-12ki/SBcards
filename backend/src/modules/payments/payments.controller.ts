import {
  Controller, Post, Get, Body, Req, Res, HttpCode,
  HttpStatus, Logger, BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /** Create a Stripe Checkout session for Pro or Org upgrade. */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(
    @CurrentUser() user: any,
    @Body('plan') plan: 'pro' | 'organization',
    @Body('billing') billing: 'monthly' | 'annual' = 'monthly',
  ) {
    if (!plan || !['pro', 'organization'].includes(plan)) {
      throw new BadRequestException('plan must be "pro" or "organization"');
    }
    return this.paymentsService.createCheckoutSession(user.userId, plan, billing);
  }

  /** Create a Stripe Billing Portal session for managing subscription. */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortal(@CurrentUser() user: any) {
    return this.paymentsService.createPortalSession(user.userId);
  }

  /** Get current subscription status. */
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@CurrentUser() user: any) {
    const sub = await this.paymentsService.getSubscription(user.userId);
    return {
      plan: sub?.plan || 'free',
      status: sub?.status || 'none',
      currentPeriodEnd: sub?.currentPeriodEnd,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
      trialUsed: sub?.trialUsed || false,
    };
  }

  /** Stripe webhook endpoint — no auth, verified by signature. */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: Request, @Res() res: Response) {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      const event = this.paymentsService.verifyWebhookSignature(
        (req as any).rawBody || JSON.stringify(req.body),
        signature,
      );
      await this.paymentsService.handleWebhook(event);
      res.json({ received: true });
    } catch (err: any) {
      this.logger.error(`Webhook error: ${err.message}`);
      throw new BadRequestException(`Webhook error: ${err.message}`);
    }
  }
}

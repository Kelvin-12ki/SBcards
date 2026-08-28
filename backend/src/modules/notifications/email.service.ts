import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromAddress = this.configService.get<string>('EMAIL_FROM', user || 'noreply@nexas.com');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://sbcards.vercel.app');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        // TLS settings for better deliverability
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false,
        },
      });
      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn(
        'SMTP config missing — email notifications disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env',
      );
    }
  }

  /** Shared email wrapper — light background, centered, max 600px */
  private wrap(body: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NEXAS</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#D4A853,#B8922E);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#0A0A0B;font-size:22px;font-weight:800;letter-spacing:1px;">NEXAS</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background-color:#fafafa;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                You received this because someone sent you a connection request on NEXAS.<br/>
                <a href="${this.frontendUrl}/settings/notifications" style="color:#D4A853;text-decoration:underline;">Manage notification preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendConnectionRequestEmail(
    to: string,
    senderName: string,
    senderEmail: string,
  ): Promise<void> {
    if (!this.transporter) return;

    const viewUrl = `${this.frontendUrl}/connections?tab=requests`;

    const html = this.wrap(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">New Connection Request</h2>
      <p style="margin:0 0 8px;color:#4b5563;line-height:1.6;font-size:15px;">
        <strong style="color:#D4A853;">${senderName}</strong> wants to connect with you on NEXAS.
      </p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
        ${senderEmail}
      </p>
      <a href="${viewUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#D4A853,#B8922E);color:#0A0A0B;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;">
        View Request
      </a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;line-height:1.5;">
        If you don't know this person, you can safely ignore or decline this request.
      </p>
    `);

    const text = [
      `New Connection Request on NEXAS`,
      ``,
      `${senderName} (${senderEmail}) wants to connect with you on NEXAS.`,
      ``,
      `View the request: ${viewUrl}`,
      ``,
      `If you don't know this person, you can safely ignore or decline this request.`,
      ``,
      `— NEXAS`,
    ].join('\n');

    try {
      await this.transporter.sendMail({
        from: `"NEXAS" <${this.fromAddress}>`,
        to,
        subject: `${senderName} wants to connect with you on NEXAS`,
        html,
        text, // plain-text fallback (important for spam filters)
        headers: {
          'List-Unsubscribe': `<${this.frontendUrl}/settings/notifications>`,
          'X-Mailer': 'NEXAS',
          'Precedence': 'bulk',
        },
        replyTo: this.fromAddress,
      });

      this.logger.log(`Connection request email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
    }
  }

  async sendWelcomeEmail(
    to: string,
    displayName: string,
  ): Promise<void> {
    if (!this.transporter) return;

    const exploreUrl = `${this.frontendUrl}/explore`;

    const html = this.wrap(`
      <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Welcome to NEXAS! 🎉</h2>
      <p style="margin:0 0 8px;color:#4b5563;line-height:1.6;font-size:15px;">
        Hi <strong>${displayName}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#4b5563;line-height:1.6;font-size:15px;">
        Your account is all set. Start by adding your professional card and connecting with people in your network.
      </p>
      <a href="${exploreUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#D4A853,#B8922E);color:#0A0A0B;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;">
        Explore NEXAS
      </a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;line-height:1.5;">
        Need help? Just reply to this email — we're here for you.
      </p>
    `);

    const text = [
      `Welcome to NEXAS!`,
      ``,
      `Hi ${displayName},`,
      ``,
      `Your account is all set. Start by adding your professional card and connecting with people in your network.`,
      ``,
      `Explore NEXAS: ${exploreUrl}`,
      ``,
      `Need help? Just reply to this email — we're here for you.`,
      ``,
      `— NEXAS`,
    ].join('\n');

    try {
      await this.transporter.sendMail({
        from: `"NEXAS" <${this.fromAddress}>`,
        to,
        subject: `Welcome to NEXAS, ${displayName}!`,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<${this.frontendUrl}/settings/notifications>`,
          'X-Mailer': 'NEXAS',
          'Precedence': 'bulk',
        },
        replyTo: this.fromAddress,
      });

      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}: ${(error as Error).message}`);
    }
  }
}

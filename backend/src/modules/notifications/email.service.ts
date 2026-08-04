import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromAddress = this.configService.get<string>('EMAIL_FROM', user || 'noreply@sbcards.com');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('Email transporter initialized');
    } else {
      this.logger.warn(
        'SMTP config missing — email notifications disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env',
      );
    }
  }

  async sendConnectionRequestEmail(
    to: string,
    senderName: string,
    senderEmail: string,
  ): Promise<void> {
    if (!this.transporter) return;

    try {
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background: #0A0A0B; color: #E5E5E5; border-radius: 16px; overflow: hidden; border: 1px solid #242428;">
          <div style="background: linear-gradient(135deg, #D4A853, #B8922E); padding: 32px; text-align: center;">
            <h1 style="color: #0A0A0B; margin: 0; font-size: 24px; font-weight: 800;">SBCards</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="color: #FFFFFF; font-size: 20px; margin: 0 0 16px;">New Connection Request</h2>
            <p style="color: #A0A0A5; line-height: 1.6; margin: 0 0 24px;">
              <strong style="color: #D4A853;">${senderName}</strong> (${senderEmail}) wants to connect with you on SBCards.
            </p>
            <a href="${this.configService.get<string>('FRONTEND_URL', 'https://sbcards.vercel.app')}/connections?tab=requests"
               style="display: inline-block; background: linear-gradient(135deg, #D4A853, #B8922E); color: #0A0A0B; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px;">
              View Request
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
              If you don't want this connection, you can ignore or decline it.
            </p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"SBCards" <${this.fromAddress}>`,
        to,
        subject: `${senderName} wants to connect with you on SBCards`,
        html,
      });

      this.logger.log(`Connection request email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
    }
  }
}

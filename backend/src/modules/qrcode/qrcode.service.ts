import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as QRCode from 'qrcode';
import {
  QrCodeScan,
  QrCodeScanDocument,
} from './entities/qrcode-scan.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class QrCodeService {
  private readonly logger = new Logger(QrCodeService.name);

  private readonly BASE_URL = 'https://sbcards.vercel.app/scan?ref=';

  constructor(
    @InjectModel(QrCodeScan.name)
    private readonly qrCodeScanModel: Model<QrCodeScanDocument>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Generate a QR code PNG buffer for a user's profile URL.
   */
  async generateQrCode(userId: string): Promise<Buffer> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const url = `${this.BASE_URL}${userId}`;

    try {
      return await QRCode.toBuffer(url, {
        type: 'png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate QR code for user ${userId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Generate a QR code and return it as a base64 data URL string.
   */
  async getQrCodeDataUrl(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const url = `${this.BASE_URL}${userId}`;

    try {
      return await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate QR code data URL for user ${userId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Record a QR code scan event.
   */
  async handleScan(
    scannerId: string,
    scannedUserId: string,
    eventId?: string,
  ): Promise<QrCodeScanDocument> {
    // Verify both users exist
    const scanner = await this.usersService.findById(scannerId);
    if (!scanner) {
      throw new NotFoundException(
        `Scanner user with ID "${scannerId}" not found`,
      );
    }

    const scannedUser = await this.usersService.findById(scannedUserId);
    if (!scannedUser) {
      throw new NotFoundException(
        `Scanned user with ID "${scannedUserId}" not found`,
      );
    }

    this.logger.log(
      `QR code scan recorded: ${scannerId} scanned ${scannedUserId}` +
        (eventId ? ` at event ${eventId}` : ''),
    );

    return this.qrCodeScanModel.create({
      scannerId,
      scannedUserId,
      eventId,
    });
  }

  /**
   * Get all scan events performed by a user.
   */
  async findScansByScanner(scannerId: string): Promise<QrCodeScanDocument[]> {
    return this.qrCodeScanModel
      .find({ scannerId })
      .sort({ createdAt: -1 })
      .exec();
  }
}

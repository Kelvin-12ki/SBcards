import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/strategies/jwt.strategy';
import { QrCodeService } from './qrcode.service';
import { UsersService } from '../users/users.service';

class ScanDto {
  scannedUserId!: string;
  eventId?: string;
}

@ApiTags('qrcode')
@Controller('qrcode')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QrCodeController {
  constructor(
    private readonly qrCodeService: QrCodeService,
    private readonly usersService: UsersService,
  ) {}

  @Get('my')
  @ApiOperation({ summary: 'Get the current user\'s QR code as a data URL' })
  async getMyQrCode(
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<{ dataUrl: string }> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const dataUrl = await this.qrCodeService.getQrCodeDataUrl(
      user._id?.toString() ?? user.id,
    );
    return { dataUrl };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get any user\'s QR code as a data URL' })
  async getUserQrCode(
    @Param('userId') userId: string,
  ): Promise<{ dataUrl: string }> {
    const dataUrl = await this.qrCodeService.getQrCodeDataUrl(userId);
    return { dataUrl };
  }

  @Post('scan')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a QR code scan event' })
  async recordScan(
    @CurrentUser() jwtUser: JwtUser,
    @Body() scanDto: ScanDto,
  ): Promise<{ scan: import('./entities/qrcode-scan.entity').QrCodeScan }> {
    if (!scanDto.scannedUserId) {
      throw new BadRequestException('scannedUserId is required');
    }

    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const scannerId = user._id?.toString() ?? user.id;

    const scan = await this.qrCodeService.handleScan(
      scannerId,
      scanDto.scannedUserId,
      scanDto.eventId,
    );

    return { scan };
  }

  @Get('scans')
  @ApiOperation({ summary: 'List QR code scans performed by the current user' })
  async getMyScans(
    @CurrentUser() jwtUser: JwtUser,
  ): Promise<{ scans: import('./entities/qrcode-scan.entity').QrCodeScan[] }> {
    const user = await this.usersService.findByFirebaseUid(jwtUser.uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const scannerId = user._id?.toString() ?? user.id;
    const scans = await this.qrCodeService.findScansByScanner(scannerId);

    return { scans };
  }
}

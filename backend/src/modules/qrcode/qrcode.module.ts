import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  QrCodeScan,
  QrCodeScanSchema,
} from './entities/qrcode-scan.entity';
import { QrCodeService } from './qrcode.service';
import { QrCodeController } from './qrcode.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QrCodeScan.name, schema: QrCodeScanSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  providers: [QrCodeService],
  controllers: [QrCodeController],
  exports: [QrCodeService],
})
export class QrCodeModule {}

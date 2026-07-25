import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Exhibitor, ExhibitorSchema } from './entities/exhibitor.entity';
import { ExhibitorsService } from './exhibitors.service';
import { ExhibitorsController } from './exhibitors.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exhibitor.name, schema: ExhibitorSchema },
    ]),
  ],
  providers: [ExhibitorsService],
  controllers: [ExhibitorsController],
  exports: [ExhibitorsService],
})
export class ExhibitorsModule {}

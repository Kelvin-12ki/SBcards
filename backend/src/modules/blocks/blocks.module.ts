import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Block, BlockSchema } from './entities/block.entity';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';

/**
 * Deliberately imports no feature module: it is depended on by both
 * ConnectionsModule and MessagingModule, so a feature dependency here would
 * create a cycle.
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: Block.name, schema: BlockSchema }])],
  providers: [BlocksService],
  controllers: [BlocksController],
  exports: [BlocksService],
})
export class BlocksModule {}

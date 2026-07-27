import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Card, CardSchema } from './entities/card.entity';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { PublicCardsController } from './public-cards.controller';
import { UsersModule } from '../users/users.module';
import { ConnectionsModule } from '../connections/connections.module';
import {
  Connection,
  ConnectionSchema,
} from '../connections/entities/connection.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Card.name, schema: CardSchema },
      { name: Connection.name, schema: ConnectionSchema },
    ]),
    UsersModule,
    forwardRef(() => ConnectionsModule),
  ],
  providers: [CardsService],
  controllers: [CardsController, PublicCardsController],
  exports: [CardsService],
})
export class CardsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/entities/user.entity';
import { Card, CardSchema } from '../cards/entities/card.entity';
import { Event, EventSchema } from '../events/entities/event.entity';
import { Session, SessionSchema } from '../sessions/entities/session.entity';
import { Exhibitor, ExhibitorSchema } from '../exhibitors/entities/exhibitor.entity';
import { Organization, OrganizationSchema } from '../organizations/entities/organization.entity';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Card.name, schema: CardSchema },
      { name: Event.name, schema: EventSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Exhibitor.name, schema: ExhibitorSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}

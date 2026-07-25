import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Organization,
  OrganizationSchema,
} from './entities/organization.entity';
import {
  OrganizationMembership,
  OrganizationMembershipSchema,
} from './entities/organization-membership.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: OrganizationMembership.name, schema: OrganizationMembershipSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  providers: [OrganizationsService, RolesGuard],
  controllers: [OrganizationsController],
  exports: [OrganizationsService, RolesGuard],
})
export class OrganizationsModule {}

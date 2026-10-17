import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthEvent, AuthEventSchema } from './entities/auth-event.entity';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { User, UserSchema } from '../users/entities/user.entity';
import { AdminGuard } from '../../common/guards/admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuthEvent.name, schema: AuthEventSchema },
      // AdminGuard resolves roles from the User collection.
      { name: User.name, schema: UserSchema },
    ]),
  ],
  // AdminGuard is provided here rather than imported from AdminModule so this
  // module stays free of feature dependencies (it is imported by AuthModule,
  // which must not be part of a cycle).
  providers: [SecurityService, AdminGuard],
  controllers: [SecurityController],
  exports: [SecurityService],
})
export class SecurityModule {}

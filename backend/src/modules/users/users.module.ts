import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminGuard } from '../../common/guards/admin.guard';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  // AdminGuard needs the User model, which this module already registers.
  providers: [UsersService, AdminGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

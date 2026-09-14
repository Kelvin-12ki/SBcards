import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';

export const PLAN_KEY = 'required_plan';
export const RequiredPlan = (plan: string) => {
  const { setMetadata } = require('@nestjs/common');
  return setMetadata(PLAN_KEY, plan);
};

const PLAN_LEVELS: Record<string, number> = { free: 0, pro: 1, organization: 2 };

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<string>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlan) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    const dbUser = await this.userModel.findById(user.userId || user.sub).select('plan');
    const userLevel = PLAN_LEVELS[dbUser?.plan || 'free'] || 0;
    const requiredLevel = PLAN_LEVELS[requiredPlan] || 0;

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `This feature requires the ${requiredPlan} plan or higher. Current plan: ${dbUser?.plan || 'free'}.`,
      );
    }

    return true;
  }
}

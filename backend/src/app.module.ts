import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CardsModule } from './modules/cards/cards.module';
import { EventsModule } from './modules/events/events.module';
import { MatchingModule } from './modules/matching/matching.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { TablesModule } from './modules/tables/tables.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { QrCodeModule } from './modules/qrcode/qrcode.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ExhibitorsModule } from './modules/exhibitors/exhibitors.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { InsightsModule } from './modules/insights/insights.module';
import { HeatmapModule } from './modules/heatmap/heatmap.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import databaseConfig from './config/database.config';
import { validateEnv } from './config/env.validation';
import { FirebaseConfig } from './config/firebase.config';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';

@Module({
  imports: [
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),

    // Rate limiting. Buckets are keyed per authenticated user (see
    // UserThrottlerGuard) so a venue full of attendees on one NAT address is
    // not treated as a single client.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: seconds(60),
        limit: 200,
      },
      {
        // Applied explicitly with @Throttle({ auth: ... }) on sensitive routes.
        name: 'auth',
        ttl: seconds(60),
        limit: 20,
      },
    ]),

    // Mongoose async configuration
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    CardsModule,
    EventsModule,
    MatchingModule,
    RecommendationsModule,
    TablesModule,
    OrganizationsModule,
    QrCodeModule,
    ConnectionsModule,
    SessionsModule,
    ExhibitorsModule,
    AnalyticsModule,
    MessagingModule,
    TimelineModule,
    NotificationsModule,
    SearchModule,
    InsightsModule,
    HeatmapModule,
    AdminModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    FirebaseConfig,
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}

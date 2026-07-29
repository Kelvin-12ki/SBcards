import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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
import databaseConfig from './config/database.config';
import { FirebaseConfig } from './config/firebase.config';

@Module({
  imports: [
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

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
  ],
  controllers: [],
  providers: [FirebaseConfig],
})
export class AppModule {}

import { BagdjaModule } from '@bagdja/node-sdk';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './common/auth';
import { UserModule } from './modules/user/user.module';
import { HealthModule } from './modules/health/health.module';
import { LibrariesModule } from './modules/libraries/libraries.module';
import { GenresModule } from './modules/genres/genres.module';
import { BooksModule } from './modules/books/books.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { PublicModule } from './modules/public/public.module';
import { ReadingProgressModule } from './modules/reading-progress/reading-progress.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { LikesModule } from './modules/likes/likes.module';
import { HighlightsModule } from './modules/highlights/highlights.module';
import { StorageModule } from './modules/storage/storage.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PlatformsModule } from './modules/platforms/platforms.module';
import { PlatformStaffModule } from './modules/platform-staff/platform-staff.module';
import { PlatformDomainsModule } from './modules/platform-domains/platform-domains.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { ChatServiceModule } from './common/chat-service/chat-service.module';
import { CommentsModule } from './modules/comments/comments.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { SeriesModule } from './modules/series/series.module';
import { CollectionsModule } from './modules/collections/collections.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChatServiceModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>(
          'DATABASE_URL',
          'postgresql://postgres:postgres@localhost:54352/postgres',
        );
        const isSupabase = databaseUrl.includes('supabase');

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: false,
          logging: config.get<string>('NODE_ENV') === 'development',
          ssl: isSupabase ? { rejectUnauthorized: false } : false,
          extra: {
            max: 10,
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
          },
        };
      },
    }),

    BagdjaModule.register({
      isGlobal: true,
      auth: {
        authServiceUrl:
          process.env.BAGDJA_AUTH_API ||
          process.env.BAGDJA_AUTH_URL ||
          'http://localhost:4001',
        jwksUrl: process.env.JWKS_URL,
      },
      logger: {
        logServiceUrl:
          process.env.BAGDJA_LOG_URL ||
          process.env.LOG_SERVICE_URL ||
          'http://localhost:4087',
        serviceName: process.env.BAGDJA_SERVICE_NAME || 'bagdja-bookpedia-api',
        clientId: process.env.CLIENT_APP_ID,
        clientSecret: process.env.CLIENT_APP_SECRET,
      },
    }),

    DatabaseModule,
    UserModule,
    AuthModule,
    HealthModule,
    LibrariesModule,
    GenresModule,
    BooksModule,
    PromotionsModule,
    SeriesModule,
    ChaptersModule,
    PublicModule,
    ReadingProgressModule,
    RatingsModule,
    LikesModule,
    HighlightsModule,
    StorageModule,
    UploadsModule,
    PlatformsModule,
    PlatformStaffModule,
    PlatformDomainsModule,
    CategoriesModule,
    TagsModule,
    CommentsModule,
    InboxModule,
    NotificationsModule,
    CollectionsModule,
  ],
})
export class AppModule {}

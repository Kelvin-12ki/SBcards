import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter — catches ALL errors and logs them
  app.useGlobalFilters(new AllExceptionsFilter());

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // One-time: drop the stale unique_participants index if it exists
  try {
    const mongoose = app.get('DatabaseConnection') || app.get('MongooseConnection');
    if (mongoose?.connection?.db) {
      const collections = await mongoose.connection.db.listCollections({ name: 'conversations' });
      if (collections.length > 0) {
        const indexes = await mongoose.connection.db.collection('conversations').indexes();
        const hasStale = indexes.some((idx: any) => idx.name === 'unique_participants');
        if (hasStale) {
          await mongoose.connection.db.collection('conversations').dropIndex('unique_participants');
          logger.log('Dropped stale unique_participants index from conversations collection');
        }
      }
    }
  } catch (err) {
    logger.warn('Could not check/drop stale index (may not exist): ' + (err as Error).message);
  }

  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5174');
  const port = configService.get<number>('PORT', 3005);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // CORS — allow the configured frontend URL in production;
  // allow any localhost origin + the frontend URL in development
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      if (nodeEnv === 'production') {
        // Production: allow the configured FRONTEND_URL, any vercel.app deployment, and localhost
        const allowed =
          origin === frontendUrl ||
          origin.endsWith('.vercel.app') ||
          origin.startsWith('http://localhost:');
        return callback(null, allowed);
      }

      // Development: permissive — allow all
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SBCards API')
    .setDescription('SBCards - Digital Business Card & Smart Networking MVP')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  logger.log(`SBCards API is running on http://localhost:${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  logger.log(`CORS enabled for origin: ${frontendUrl}`);

  // Seed admin role AFTER server is listening (DB connection is guaranteed)
  try {
    const mongoose = app.get('DatabaseConnection') || app.get('MongooseConnection');
    if (mongoose?.connection?.db) {
      const usersColl = mongoose.connection.db.collection('users');
      const adminExists = await usersColl.findOne({ role: 'admin' });
      if (!adminExists) {
        const firstUser = await usersColl.findOne({}, { sort: { createdAt: 1 } });
        if (firstUser) {
          await usersColl.updateOne({ _id: firstUser._id }, { $set: { role: 'admin' } });
          logger.log(`Seeded admin role for user: ${firstUser.email}`);
        }
      }
    }
  } catch (err) {
    logger.warn('Could not seed admin role: ' + (err as Error).message);
  }

  // One-time cleanup: strip huge base64 avatarUrls from cards
  try {
    const mongoose = app.get('DatabaseConnection') || app.get('MongooseConnection');
    if (mongoose?.connection?.db) {
      const cardsColl = mongoose.connection.db.collection('cards');
      // base64 data URLs start with "data:image" and are typically > 1KB
      const result = await cardsColl.updateMany(
        { avatarUrl: { $regex: '^data:image', $options: 'i' } },
        { $unset: { avatarUrl: '' } },
      );
      if (result.modifiedCount > 0) {
        logger.log(`Cleaned ${result.modifiedCount} cards with huge base64 avatarUrls`);
      }
    }
  } catch (err) {
    logger.warn('Could not cleanup base64 avatarUrls: ' + (err as Error).message);
  }
}

void bootstrap();

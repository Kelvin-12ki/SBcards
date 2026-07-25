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
        // Production: only allow the configured FRONTEND_URL
        const allowed = origin === frontendUrl || origin.startsWith('http://localhost:');
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
}

void bootstrap();

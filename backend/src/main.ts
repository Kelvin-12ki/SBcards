import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Build the production CORS allowlist.
 *
 * Explicit origins only. The previous wildcard (`*.vercel.app` + any localhost)
 * meant any attacker-controlled Vercel deploy could make credentialed calls
 * against this API with a victim's session.
 */
function buildAllowedOrigins(configService: ConfigService): string[] {
  const raw = [
    configService.get<string>('FRONTEND_URL'),
    ...(configService.get<string>('CORS_ORIGINS') ?? '').split(','),
    // Hardcoded fallbacks so the app works even if env vars are missing on
    // Render. These are the known production origins.
    'https://sbcards.vercel.app',
    'http://localhost:3007',
  ];

  return Array.from(
    new Set(
      raw
        .map((o) => (o ?? '').trim().replace(/\/$/, ''))
        .filter((o) => o.length > 0),
    ),
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 5177);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  // Render terminates TLS at its edge proxy; without this req.ip is the
  // proxy's address and every client shares one rate-limit bucket.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.useGlobalFilters(new AllExceptionsFilter());

  // Security headers. `contentSecurityPolicy` is disabled because this process
  // serves JSON + the Swagger UI only — the SPA is hosted separately.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(compression());

  const allowedOrigins = buildAllowedOrigins(configService);

  app.enableCors({
    origin: (origin, callback) => {
      // No Origin header: native mobile clients, server-to-server, curl.
      // These are not browser contexts, so CORS grants them nothing extra.
      if (!origin) {
        return callback(null, true);
      }

      const normalized = origin.replace(/\/$/, '');

      if (!isProduction) {
        // Development: allow the allowlist plus any localhost port.
        const ok =
          allowedOrigins.includes(normalized) ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized);
        return callback(null, ok);
      }

      const ok = allowedOrigins.includes(normalized);
      if (!ok) {
        logger.warn(`CORS: rejected origin ${origin}`);
      }
      return callback(null, ok);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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

  // Swagger exposes a complete map of every endpoint. Off in production unless
  // deliberately re-enabled for a debugging session.
  const swaggerEnabled =
    !isProduction || configService.get<string>('SWAGGER_ENABLED') === 'true';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SBCards API')
      .setDescription('SBCards - Digital Business Card & Smart Networking')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  // Let Nest run onModuleDestroy hooks when Render sends SIGTERM, so in-flight
  // requests finish and the Mongo pool closes cleanly on redeploy.
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  logger.log(`SBCards API listening on port ${port} (${nodeEnv})`);
  logger.log(
    `CORS allowlist: ${allowedOrigins.join(', ') || '(none configured)'}`,
  );
  logger.log(
    `Swagger: ${swaggerEnabled ? 'enabled at /api/docs' : 'disabled'}`,
  );
}

void bootstrap();

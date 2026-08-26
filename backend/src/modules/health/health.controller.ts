import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * Unauthenticated liveness/readiness probe.
 *
 * Render polls this to decide when a new deploy is ready to take traffic and
 * to keep the instance warm; it must stay cheap and must not be rate limited.
 */
@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Liveness and database readiness probe' })
  check() {
    // 1 = connected, 2 = connecting, 0 = disconnected, 3 = disconnecting
    const dbConnected = this.connection.readyState === 1;

    return {
      status: dbConnected ? 'ok' : 'degraded',
      database: dbConnected ? 'up' : 'down',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}

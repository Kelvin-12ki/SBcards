import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export default function databaseConfig(
  configService: ConfigService,
): MongooseModuleOptions {
  const uri = configService.getOrThrow<string>('MONGODB_URI');

  return {
    uri,

    // Connection pool. Atlas shared/Flex tiers cap total connections per
    // cluster, and each Render instance holds its own pool — keep the ceiling
    // well under the cluster limit so a redeploy (old + new instance briefly
    // overlapping) cannot exhaust it.
    maxPoolSize: Number(configService.get('MONGO_MAX_POOL_SIZE', 20)),
    minPoolSize: Number(configService.get('MONGO_MIN_POOL_SIZE', 2)),

    // Fail fast instead of hanging a request for 30s when the primary is
    // unreachable — the client can retry, a stuck socket cannot.
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    connectTimeoutMS: 10_000,

    // Release idle sockets so a quiet instance is not holding cluster slots.
    maxIdleTimeMS: 60_000,

    retryWrites: true,

    // Left on by default: several schema indexes are unique constraints that
    // enforce correctness (one check-in per user per event, one connection per
    // pair), and silently skipping their creation would be worse than the
    // startup cost. Set MONGO_AUTO_INDEX=false only once the indexes exist and
    // you have a deliberate migration step for new ones.
    autoIndex: configService.get<string>('MONGO_AUTO_INDEX') !== 'false',
  };
}

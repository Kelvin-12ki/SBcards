import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export default function databaseConfig(
  configService: ConfigService,
): MongooseModuleOptions {
  const uri =
    configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/sbcards';

  return {
    uri,
  };
}

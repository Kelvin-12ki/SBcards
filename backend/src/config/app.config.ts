import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3007',
  port: parseInt(process.env.PORT || '3005', 10),
}));

/**
 * Boot-time environment validation.
 *
 * Runs before Nest builds the DI graph. Anything missing or obviously unsafe
 * throws here so the process dies loudly at deploy time rather than booting
 * into a state where, say, JWTs are signed with a guessable fallback secret.
 */

const REQUIRED_ALWAYS = ['MONGODB_URI', 'JWT_SECRET'] as const;

const REQUIRED_IN_PRODUCTION = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FRONTEND_URL',
] as const;

/** Values that shipped in .env.example — never acceptable in a real deploy. */
const PLACEHOLDER_SECRETS = [
  'your-super-secret-jwt-key-change-in-production',
  'fallback-secret',
  'secret',
  'changeme',
];

const MIN_JWT_SECRET_LENGTH = 32;

export function validateEnv(config: Record<string, unknown>) {
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  const isProduction = nodeEnv === 'production';
  const errors: string[] = [];

  const required = [
    ...REQUIRED_ALWAYS,
    ...(isProduction ? REQUIRED_IN_PRODUCTION : []),
  ];

  for (const key of required) {
    const value = config[key];
    if (value === undefined || String(value).trim() === '') {
      errors.push(
        `${key} is required${isProduction ? ' in production' : ''} but was not set`,
      );
    }
  }

  const jwtSecret = String(config.JWT_SECRET ?? '');

  if (jwtSecret && PLACEHOLDER_SECRETS.includes(jwtSecret.toLowerCase())) {
    errors.push(
      'JWT_SECRET is still set to a placeholder value — generate a real one',
    );
  }

  if (jwtSecret && jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters (got ${jwtSecret.length}). ` +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    );
  }

  if (isProduction) {
    const mongoUri = String(config.MONGODB_URI ?? '');
    if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
      errors.push('MONGODB_URI points at localhost in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(
      'Environment validation failed:\n' +
        errors.map((e) => `  - ${e}`).join('\n') +
        '\n\nRefusing to start. Fix these variables and redeploy.',
    );
  }

  return config;
}

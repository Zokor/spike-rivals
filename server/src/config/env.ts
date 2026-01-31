export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001'),
  WS_PORT: parseInt(process.env.WS_PORT || '2567'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/spike_rivals',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'spike-rivals-dev-secret-change-in-production',
  JWT_EXPIRES_IN: '7d',

  // Game
  TICK_RATE: 60,
} as const;

export function validateEnv(): void {
  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET === 'spike-rivals-dev-secret-change-in-production') {
      throw new Error('JWT_SECRET must be set in production');
    }
  }
}

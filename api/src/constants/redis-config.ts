import { processEnvBoolean } from '@boom-platform/globals';

export const REDIS_ENABLED = processEnvBoolean(process.env.REDIS_ENABLED);
export const REDIS_CONFIGURATION = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || '6379',
};

import { registerAs } from '@nestjs/config';
import { IRedisConfig } from '../interfaces/config.interface';

export default registerAs(
    'redis',
    (): IRedisConfig => ({
        url: process.env.REDIS_URL,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'auth:',
        ttl: parseInt(process.env.REDIS_TTL || '3600'),
    }),
);

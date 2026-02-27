import { registerAs } from '@nestjs/config';
import { IAppConfig } from '../interfaces/config.interface';

export default registerAs('app', (): IAppConfig => {
    const corsOriginsEnv = process.env.APP_CORS_ORIGINS;
    const corsOrigin: boolean | string[] =
        !corsOriginsEnv || corsOriginsEnv === '*'
            ? true
            : corsOriginsEnv.split(',').map(origin => origin.trim());

    return {
        env: process.env.NODE_ENV || 'development',
        name: process.env.APP_NAME || 'NestJS Service',

        versioning: {
            enable: process.env.HTTP_VERSIONING_ENABLE === 'true',
            prefix: process.env.HTTP_VERSION_PREFIX || 'v',
            version: process.env.HTTP_VERSION || '1',
        },

        throttle: {
            ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
            limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
        },

        http: {
            host: process.env.HTTP_HOST || '0.0.0.0',
            port: parseInt(process.env.HTTP_PORT || '9001', 10),
        },

        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'Accept',
                'Origin',
                'X-Requested-With',
                'X-Request-ID',
                'X-Correlation-ID',
            ],
            credentials: true,
            exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Request-ID'],
        },

        sentry: {
            dsn: process.env.SENTRY_DSN,
            env: process.env.NODE_ENV || 'development',
        },

        debug: process.env.APP_DEBUG === 'true',
        logLevel: process.env.APP_LOG_LEVEL || 'info',
    };
});

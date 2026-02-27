import { registerAs } from '@nestjs/config';
import { IDocConfig } from '../interfaces/config.interface';

export default registerAs(
    'doc',
    (): IDocConfig => ({
        name: `${process.env.APP_NAME || 'NestJS Service'} API Documentation`,
        description: `Comprehensive API documentation for ${process.env.APP_NAME || 'NestJS Service'}`,
        version: process.env.API_VERSION || '1.0.0',
        prefix: process.env.DOC_PREFIX || '/docs',
    }),
);

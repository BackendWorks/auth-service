export interface IAppConfig {
    env: string;
    name: string;
    versioning: {
        enable: boolean;
        prefix: string;
        version: string;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
    http: {
        host: string;
        port: number;
    };
    cors: {
        origin: string[] | boolean;
        methods: string[];
        allowedHeaders: string[];
        credentials: boolean;
        exposedHeaders: string[];
    };
    sentry: {
        dsn?: string;
        env: string;
    };
    debug: boolean;
    logLevel: string;
}

export interface IAuthConfig {
    accessToken: {
        secret: string;
        expirationTime: number;
    };
    refreshToken: {
        secret: string;
        expirationTime: number;
    };
}

export interface IDocConfig {
    name: string;
    description: string;
    version: string;
    prefix: string;
}

export interface IGrpcConfig {
    url: string;
    package: string;
}

export interface IRedisConfig {
    url: string;
    keyPrefix: string;
    ttl: number;
}

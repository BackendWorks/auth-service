import { registerAs } from '@nestjs/config';
import ms from 'ms';
import { IAuthConfig } from '../interfaces/config.interface';

function parseTimeToSeconds(timeString: string, defaultValue: string): number {
    try {
        return ms(timeString || defaultValue) / 1000;
    } catch (error) {
        console.warn(`Invalid time format: ${timeString}, using default: ${defaultValue}`);
        return ms(defaultValue) / 1000;
    }
}

export default registerAs('auth', (): IAuthConfig => {
    // Validate required secrets
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET_KEY;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET_KEY;

    if (!accessTokenSecret || !refreshTokenSecret) {
        throw new Error(
            'JWT secrets are required. Please set ACCESS_TOKEN_SECRET_KEY and REFRESH_TOKEN_SECRET_KEY',
        );
    }

    if (accessTokenSecret.length < 32 || refreshTokenSecret.length < 32) {
        console.warn('JWT secrets should be at least 32 characters long for security');
    }

    return {
        accessToken: {
            secret: accessTokenSecret,
            expirationTime: parseTimeToSeconds(process.env.ACCESS_TOKEN_EXPIRED, '15m'),
        },
        refreshToken: {
            secret: refreshTokenSecret,
            expirationTime: parseTimeToSeconds(process.env.REFRESH_TOKEN_EXPIRED, '7d'),
        },
    };
});

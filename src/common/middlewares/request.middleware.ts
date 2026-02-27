import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(request: Request, response: Response, next: NextFunction): void {
        const { method, originalUrl, ip } = request;
        const userAgent = request.get('user-agent') || 'Unknown';
        const startTime = Date.now();
        const requestId = this.generateRequestId();

        // Add request ID to request object for tracing
        request['requestId'] = requestId;

        // Set request ID header
        response.setHeader('X-Request-ID', requestId);

        this.logger.log(`→ ${method} ${originalUrl} - ${ip} ${userAgent} [${requestId}]`);

        response.on('finish', () => {
            const { statusCode } = response;
            const contentLength = response.get('content-length') || 0;
            const responseTime = Date.now() - startTime;

            const logLevel = statusCode >= 400 ? 'warn' : 'log';
            const statusIcon = this.getStatusIcon(statusCode);

            this.logger[logLevel](
                `${statusIcon} ${method} ${originalUrl} ${statusCode} ${contentLength}b - ${responseTime}ms [${requestId}]`,
            );
        });

        response.on('error', error => {
            this.logger.error(`✖ ${method} ${originalUrl} - Request failed [${requestId}]`, error);
        });

        next();
    }

    private generateRequestId(): string {
        return (
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        );
    }

    private getStatusIcon(statusCode: number): string {
        if (statusCode >= 200 && statusCode < 300) return '✓';
        if (statusCode >= 300 && statusCode < 400) return '→';
        if (statusCode >= 400 && statusCode < 500) return '⚠';
        if (statusCode >= 500) return '✖';
        return '?';
    }
}

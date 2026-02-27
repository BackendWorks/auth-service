import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import { IErrorResponse } from '../interfaces/response.interface';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ResponseExceptionFilter.name);

    constructor(private readonly configService: ConfigService) {
        this.initializeSentry();
    }

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const statusCode =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        let message = 'Internal server error';

        if (exception instanceof BadRequestException) {
            const exceptionResponse = exception.getResponse() as any;
            message = Array.isArray(exceptionResponse.message)
                ? exceptionResponse.message.join(', ')
                : exceptionResponse.message || message;
        } else if (exception instanceof HttpException) {
            message = exception.message;
        }

        const errorResponse: IErrorResponse = {
            statusCode,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
        };

        if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`${request.method} ${request.url} - ${statusCode}`, exception);
            this.captureSentryException(exception, request);
        }

        response.status(statusCode).json(errorResponse);
    }

    private initializeSentry(): void {
        const sentryDsn = this.configService.get<string>('sentry.dsn');
        if (sentryDsn) {
            Sentry.init({
                dsn: sentryDsn,
                environment: this.configService.get<string>('app.env'),
                tracesSampleRate: 1.0,
            });
        }
    }

    private captureSentryException(exception: unknown, request: Request): void {
        Sentry.withScope(scope => {
            scope.setExtra('requestUrl', request.url);
            scope.setExtra('method', request.method);
            scope.setExtra('body', request.body);
            scope.setExtra('query', request.query);

            if (exception instanceof Error) {
                Sentry.captureException(exception);
            } else {
                Sentry.captureMessage(String(exception));
            }
        });
    }
}

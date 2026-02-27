import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { Observable } from 'rxjs';
import { map, from, switchMap } from 'rxjs';
import { MESSAGE_DTO_METADATA, MESSAGE_KEY_METADATA } from '../constants/response.constant';
import { IApiResponse } from '../interfaces/response.interface';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly i18n: I18nService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<unknown>> {
        const messageKey = this.reflector.get<string>(MESSAGE_KEY_METADATA, context.getHandler());

        const messageDto = this.reflector.get<new () => any>(
            MESSAGE_DTO_METADATA,
            context.getHandler(),
        );

        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            switchMap(data =>
                from(this.getResponseMessage(messageKey, statusCode)).pipe(
                    map(message => {
                        let transformedData = data;
                        if (messageDto && data) {
                            transformedData = plainToInstance(messageDto, data, {
                                enableImplicitConversion: true,
                            });
                        }

                        return {
                            statusCode,
                            timestamp: new Date().toISOString(),
                            message,
                            data: transformedData ?? null,
                        };
                    }),
                ),
            ),
        );
    }

    private async getResponseMessage(
        messageKey: string | undefined,
        statusCode: number,
    ): Promise<string> {
        if (messageKey) {
            return this.i18n.translate(messageKey, {
                defaultValue: this.getDefaultMessageKey(statusCode),
            });
        }
        return this.i18n.translate(this.getDefaultMessageKey(statusCode));
    }

    private getDefaultMessageKey(statusCode: number): string {
        return `http.success.${statusCode}`;
    }
}

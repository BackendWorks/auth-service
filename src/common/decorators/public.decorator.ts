import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PUBLIC_ROUTE_KEY } from '../constants/request.constant';

export const PublicRoute = (description?: string) => {
    const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
        SetMetadata(PUBLIC_ROUTE_KEY, true),
    ];

    if (description) {
        decorators.push(
            ApiOperation({
                summary: description,
                security: [], // This removes the lock icon in Swagger for public routes
            }),
        );
    }

    return applyDecorators(...decorators);
};

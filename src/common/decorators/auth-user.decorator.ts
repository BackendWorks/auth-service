import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthPayload } from 'src/modules/auth/interfaces/auth.interface';

export const AuthUser = createParamDecorator(
    (data: keyof IAuthPayload | undefined, ctx: ExecutionContext): IAuthPayload | any => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as IAuthPayload;

        return data ? user?.[data] : user;
    },
);

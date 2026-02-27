import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthJwtRefreshGuard extends AuthGuard('jwt-refresh') {
    constructor() {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isRpc = context.getType() === 'rpc';

        if (isRpc) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest<TUser = any>(
        err: Error,
        user: TUser,
        info: Error,
        context: ExecutionContext,
    ): TUser {
        const isRpc = context.getType() === 'rpc';

        if (isRpc) {
            return user;
        }

        if (err || !user) {
            throw new UnauthorizedException('Refresh token is invalid or expired');
        }

        return user;
    }
}

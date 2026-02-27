import { Role } from '@prisma/client';

export interface IAuthUserPayload {
    id: string;
    role: Role;
}

export interface IRequestWithUser extends Request {
    user: IAuthUserPayload;
    requestId?: string;
    correlationId?: string;
}

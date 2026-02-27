import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ROLES_DECORATOR_KEY } from '../constants/request.constant';

export const AllowedRoles = (roles: Role[]) => {
    return applyDecorators(SetMetadata(ROLES_DECORATOR_KEY, roles), ApiBearerAuth('accessToken'));
};

// Convenience decorators for common role combinations
export const AdminOnly = () => AllowedRoles([Role.ADMIN]);
export const UserAndAdmin = () => AllowedRoles([Role.USER, Role.ADMIN]);

import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { AdminOnly } from 'src/common/decorators/auth-roles.decorator';
import { MessageKey } from 'src/common/decorators/message.decorator';
import { SwaggerGenericResponse, SwaggerPaginatedResponse } from 'src/common/dtos/api-response.dto';

import { UserAdminService } from '../services/user.admin.service';
import { UserListDto } from '../dtos/user-list.dto';
import { UserResponseDto } from '../dtos/user.response.dto';
import { PaginatedResult } from 'src/common/interfaces/query-builder.interface';

@ApiTags('user.admin')
@Controller({ version: '1', path: '/admin/user' })
export class UserAdminController {
    constructor(private readonly userAdminService: UserAdminService) {}

    @AdminOnly()
    @Get()
    @MessageKey('user.success.list', UserResponseDto)
    @ApiOperation({
        summary: 'List all users',
        description: 'Retrieve paginated list of users with search and filtering',
    })
    @ApiResponse({
        description: 'Users retrieved successfully',
        type: SwaggerPaginatedResponse(UserResponseDto),
    })
    async listUsers(@Query() listDto: UserListDto): Promise<PaginatedResult<UserResponseDto>> {
        return this.userAdminService.listUsers(listDto);
    }

    @AdminOnly()
    @Delete(':id')
    @MessageKey('user.success.delete')
    @ApiOperation({
        summary: 'Delete user',
        description: 'Soft delete a user by ID',
    })
    @ApiParam({
        name: 'id',
        description: 'User ID to delete',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        description: 'User deleted successfully',
        type: SwaggerGenericResponse,
    })
    async deleteUser(@Param('id') id: string): Promise<void> {
        return this.userAdminService.deleteUser(id);
    }
}

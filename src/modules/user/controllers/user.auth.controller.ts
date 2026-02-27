import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

import { UserAuthService } from '../services/user.auth.service';
import { UserAndAdmin } from 'src/common/decorators/auth-roles.decorator';
import { MessageKey } from 'src/common/decorators/message.decorator';
import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { SwaggerResponse } from 'src/common/dtos/api-response.dto';

import { UserResponseDto } from '../dtos/user.response.dto';
import { UserUpdateDto } from '../dtos/user.update.dto';

@ApiTags('user.auth')
@Controller({ version: '1', path: '/user' })
export class UserAuthController {
    constructor(private readonly userAuthService: UserAuthService) {}

    @UserAndAdmin()
    @Get('profile')
    @MessageKey('user.success.get', UserResponseDto)
    @ApiOperation({
        summary: 'Get user profile',
        description: 'Retrieve current user profile information',
    })
    @ApiOkResponse({
        description: 'User profile successfully retrieved',
        type: SwaggerResponse(UserResponseDto),
    })
    async getUserProfile(@AuthUser('id') userId: string): Promise<UserResponseDto> {
        return this.userAuthService.getUserProfile(userId);
    }

    @UserAndAdmin()
    @Put('profile')
    @MessageKey('user.success.update', UserResponseDto)
    @ApiOperation({
        summary: 'Update user profile',
        description: 'Update current user profile information',
    })
    @ApiOkResponse({
        description: 'User profile successfully updated',
        type: SwaggerResponse(UserResponseDto),
    })
    async updateUserProfile(
        @AuthUser('id') userId: string,
        @Body() updateDto: UserUpdateDto,
    ): Promise<UserResponseDto> {
        return this.userAuthService.updateUserProfile(userId, updateDto);
    }
}

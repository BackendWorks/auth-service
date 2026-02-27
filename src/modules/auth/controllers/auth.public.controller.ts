import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthUser } from 'src/common/decorators/auth-user.decorator';
import { MessageKey } from 'src/common/decorators/message.decorator';
import { PublicRoute } from 'src/common/decorators/public.decorator';
import { AuthJwtRefreshGuard } from 'src/common/guards/jwt.refresh.guard';
import { SwaggerResponse } from 'src/common/dtos/api-response.dto';

import { AuthLoginDto } from '../dtos/auth.login.dto';
import { AuthRefreshResponseDto, AuthResponseDto } from '../dtos/auth.response.dto';
import { AuthSignupDto } from '../dtos/auth.signup.dto';
import { IAuthPayload } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';

@ApiTags('auth.public')
@Controller({ version: '1', path: '/auth' })
export class AuthPublicController {
    constructor(private readonly authService: AuthService) {}

    @PublicRoute()
    @Post('login')
    @MessageKey('auth.success.login', AuthResponseDto)
    @ApiOperation({
        summary: 'User login',
        description: 'Authenticate user with email and password',
    })
    @ApiResponse({
        status: 201,
        description: 'User successfully authenticated',
        type: SwaggerResponse(AuthResponseDto),
    })
    login(@Body() payload: AuthLoginDto): Promise<AuthResponseDto> {
        return this.authService.login(payload);
    }

    @PublicRoute()
    @Post('signup')
    @MessageKey('auth.success.signup', AuthResponseDto)
    @ApiOperation({
        summary: 'User registration',
        description: 'Create a new user account',
    })
    @ApiResponse({
        status: 201,
        description: 'User successfully created and authenticated',
        type: SwaggerResponse(AuthResponseDto),
    })
    signup(@Body() payload: AuthSignupDto): Promise<AuthResponseDto> {
        return this.authService.signup(payload);
    }

    @UseGuards(AuthJwtRefreshGuard)
    @PublicRoute()
    @Get('refresh')
    @MessageKey('auth.success.refresh', AuthRefreshResponseDto)
    @ApiOperation({
        summary: 'Refresh tokens',
        description: 'Generate new access and refresh tokens using refresh token',
    })
    @ApiResponse({
        status: 200,
        description: 'Tokens successfully refreshed',
        type: SwaggerResponse(AuthRefreshResponseDto),
    })
    refreshTokens(@AuthUser() user: IAuthPayload): Promise<AuthRefreshResponseDto> {
        return this.authService.generateTokens(user);
    }
}

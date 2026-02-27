import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { UserResponseDto } from 'src/modules/user/dtos/user.response.dto';

export class AuthRefreshResponseDto {
    @ApiProperty({
        description: 'JWT access token for API authentication',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken!: string;

    @ApiProperty({
        description: 'JWT refresh token for obtaining new access tokens',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    refreshToken!: string;
}

export class AuthResponseDto extends AuthRefreshResponseDto {
    @ApiProperty({
        description: 'Authenticated user information',
        type: UserResponseDto,
    })
    @Type(() => UserResponseDto)
    @ValidateNested()
    user!: UserResponseDto;
}

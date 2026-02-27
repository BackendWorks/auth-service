import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Role } from '@backendworks/auth-db';
import { ApiBaseQueryDto } from 'src/common/dtos/api-query.dto';

const RoleValues = ['USER', 'ADMIN'] as const;

export class UserListDto extends ApiBaseQueryDto {
    @ApiProperty({
        description: 'Filter users by role',
        enum: RoleValues,
        required: false,
    })
    @IsOptional()
    @IsEnum(RoleValues)
    role?: Role;

    @ApiProperty({
        description: 'Filter users by verification status',
        example: true,
        required: false,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isVerified?: boolean;

    @ApiProperty({
        description: 'Filter users by email domain',
        example: 'gmail.com',
        required: false,
    })
    @IsOptional()
    emailDomain?: string;
}

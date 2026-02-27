import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { $Enums, User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserResponseDto implements User {
    @ApiProperty({
        description: 'Unique user identifier',
        format: 'uuid',
    })
    id: string;

    @ApiProperty({
        description: 'User email address',
        format: 'email',
    })
    email: string;

    @ApiProperty({
        description: 'User first name',
    })
    firstName: string;

    @ApiProperty({
        description: 'User last name',
    })
    lastName: string;

    @ApiProperty({
        description: 'User phone number',
        nullable: true,
    })
    phoneNumber: string | null;

    @ApiProperty({
        description: 'User profile picture URL',
        nullable: true,
    })
    avatar: string | null;

    @ApiProperty({
        description: 'Email verification status',
    })
    isVerified: boolean;

    @ApiProperty({
        description: 'User role in the system',
        enum: $Enums.Role,
    })
    role: $Enums.Role;

    @ApiProperty({
        description: 'Account creation timestamp',
        format: 'date-time',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Last profile update timestamp',
        format: 'date-time',
    })
    updatedAt: Date;

    @ApiProperty({
        description: 'Account deletion timestamp',
        nullable: true,
        format: 'date-time',
    })
    deletedAt: Date | null;

    @Exclude()
    @ApiHideProperty()
    password: string;
}

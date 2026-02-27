import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, Matches, IsUrl } from 'class-validator';

export class UserUpdateDto {
    @ApiProperty({
        description: 'User email address',
        required: false,
        format: 'email',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: 'User phone number (international format)',
        required: false,
        pattern: '^\\+?[1-9]\\d{1,14}$',
    })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'Phone number must be in valid international format',
    })
    phoneNumber?: string;

    @ApiProperty({
        description: 'User first name',
        required: false,
    })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({
        description: 'User last name',
        required: false,
    })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiProperty({
        description: 'User profile picture URL',
        required: false,
        format: 'uri',
    })
    @IsOptional()
    @IsUrl()
    avatar?: string;
}

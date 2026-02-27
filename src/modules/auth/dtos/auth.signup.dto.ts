import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AuthSignupDto {
    @ApiProperty({
        description: 'User email address',
        example: faker.internet.email(),
        format: 'email',
    })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({
        description: 'User password (minimum 8 characters)',
        example: faker.internet.password({ length: 12 }),
        minLength: 8,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password!: string;

    @ApiProperty({
        description: 'User first name',
        example: faker.person.firstName(),
        required: false,
    })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({
        description: 'User last name',
        example: faker.person.lastName(),
        required: false,
    })
    @IsString()
    @IsOptional()
    lastName?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min, IsInt, IsString, IsIn } from 'class-validator';

export class ApiBaseQueryDto {
    @ApiProperty({
        description: 'Page number (starts from 1)',
        example: 1,
        minimum: 1,
        default: 1,
        required: false,
    })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10,
        required: false,
    })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiProperty({
        description: 'Field to sort by',
        example: 'createdAt',
        required: false,
    })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiProperty({
        description: 'Sort order',
        example: 'desc',
        enum: ['asc', 'desc'],
        required: false,
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

    @ApiProperty({
        description: 'Search term for full-text search',
        example: 'john doe',
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;
}

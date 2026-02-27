import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Base API Response DTO
export abstract class ApiBaseResponseDto {
    @ApiProperty({ description: 'HTTP Status code', example: 200 })
    statusCode: number;

    @ApiProperty({
        description: 'Timestamp of the response',
        example: new Date().toISOString(),
    })
    timestamp: string;

    @ApiProperty({ description: 'Response message', example: 'Success' })
    message: string;
}

// Generic response DTO with data
export abstract class ApiResponseDto<T> extends ApiBaseResponseDto {
    abstract data: T;
}

export class SwaggerGenericResponse extends ApiBaseResponseDto {}

// SwaggerResponse generator for single object responses
export function SwaggerResponse<TModel>(model: new () => TModel) {
    class SwaggerResponseType extends ApiResponseDto<TModel> {
        @ApiProperty({
            type: () => model,
            description: 'Response data',
        })
        @Type(() => model)
        data: TModel;
    }

    Object.defineProperty(SwaggerResponseType, 'name', {
        value: `${model.name}Response`,
    });

    return SwaggerResponseType;
}

// Response wrapper for array
export function SwaggerArrayResponse<TModel>(model: new () => TModel) {
    class SwaggerResponseType extends ApiResponseDto<TModel[]> {
        @ApiProperty({ type: () => model, isArray: true })
        @Type(() => model)
        data: TModel[];
    }

    Object.defineProperty(SwaggerResponseType, 'name', {
        value: `${model.name}ArrayResponse`,
    });

    return SwaggerResponseType;
}

// Metadata DTO
export class PaginationMetaDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 10 })
    limit: number;

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ example: 10 })
    totalPages: number;

    @ApiProperty({ example: true })
    hasNextPage: boolean;

    @ApiProperty({ example: false })
    hasPreviousPage: boolean;
}

// SwaggerPaginatedResponse generator
export function SwaggerPaginatedResponse<TModel>(model: new () => TModel) {
    class PaginatedResultDto {
        @ApiProperty({ isArray: true, type: () => model })
        @Type(() => model)
        items: TModel[];

        @ApiProperty({ type: () => PaginationMetaDto })
        @Type(() => PaginationMetaDto)
        meta: PaginationMetaDto;
    }

    class SwaggerResponseType extends ApiResponseDto<PaginatedResultDto> {
        @ApiProperty({
            type: () => PaginatedResultDto,
            description: 'Paginated response data',
        })
        @Type(() => PaginatedResultDto)
        data: PaginatedResultDto;
    }

    Object.defineProperty(PaginatedResultDto, 'name', {
        value: `${model.name}PaginatedResult`,
    });

    Object.defineProperty(SwaggerResponseType, 'name', {
        value: `${model.name}PaginatedResponse`,
    });

    return SwaggerResponseType;
}

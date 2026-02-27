import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PaginatedResult, QueryBuilderOptions } from '../interfaces/query-builder.interface';

@Injectable()
export class QueryBuilderService {
    constructor(private readonly databaseService: DatabaseService) {}

    async findManyWithPagination<T>(options: QueryBuilderOptions): Promise<PaginatedResult<T>> {
        const {
            dto,
            defaultSort = { field: 'createdAt', order: 'desc' },
            searchFields = [],
            relations = [],
            customFilters = {},
        } = options;

        const page = Number(dto.page) || 1;
        const limit = Math.min(Number(dto.limit) || 10, 100);
        const sortBy = dto.sortBy || defaultSort.field;
        const sortOrder = dto.sortOrder || defaultSort.order;

        const result = await this.databaseService.userRepository.findMany({
            page,
            limit,
            search: dto.search,
            searchFields: searchFields.length ? searchFields : undefined,
            sortBy,
            sortOrder: sortOrder as 'asc' | 'desc',
            relations,
            customFilters: { ...this.buildExtraFilters(dto), ...customFilters } as Record<
                string,
                unknown
            >,
        });

        return result as unknown as PaginatedResult<T>;
    }

    private buildExtraFilters(dto: any): Record<string, unknown> {
        const filters: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(dto)) {
            if (
                ['page', 'limit', 'search', 'sortBy', 'sortOrder'].includes(key) ||
                value === undefined ||
                value === null
            )
                continue;

            if (key.endsWith('Domain') && typeof value === 'string') {
                filters[key.replace('Domain', '')] = { endsWith: `@${value}` };
            } else if (key.includes('Date') && typeof value === 'string') {
                filters[key] = { gte: new Date(value) };
            } else if (Array.isArray(value)) {
                filters[key] = { in: value };
            } else if (typeof value === 'string' && key.includes('Name')) {
                filters[key] = { contains: value, mode: 'insensitive' };
            } else {
                filters[key] = value;
            }
        }

        return filters;
    }

    async getCount(model: string, filters?: any): Promise<number> {
        return this.databaseService.userRepository.count(filters);
    }
}

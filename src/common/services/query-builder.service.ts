import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PaginatedResult, QueryBuilderOptions } from '../interfaces/query-builder.interface';

@Injectable()
export class QueryBuilderService {
    constructor(private readonly databaseService: DatabaseService) {}

    async findManyWithPagination<T>(options: QueryBuilderOptions): Promise<PaginatedResult<T>> {
        const {
            model,
            dto,
            defaultSort = { field: 'createdAt', order: 'desc' },
            searchFields = [],
            relations = [],
            customFilters = {},
        } = options;

        const page = Number(dto.page) || 1;
        const limit = Math.min(Number(dto.limit) || 10, 100);
        const skip = (page - 1) * limit;
        const sortBy = dto.sortBy || defaultSort.field;
        const sortOrder = dto.sortOrder || defaultSort.order;

        const where = this.buildWhereClause(dto, searchFields, customFilters);
        const include = this.buildIncludeClause(relations);
        const modelAccessor = this.databaseService[model as keyof DatabaseService] as any;

        const [items, total] = await Promise.all([
            modelAccessor.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: Object.keys(include).length ? include : undefined,
            }),
            modelAccessor.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
            items,
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    private buildWhereClause(
        dto: any,
        searchFields: string[],
        customFilters: Record<string, any>,
    ): any {
        const where: any = { deletedAt: null };

        if (dto.search && searchFields.length) {
            where.OR = searchFields.map(field => ({
                [field]: { contains: dto.search, mode: 'insensitive' },
            }));
        }

        for (const [key, value] of Object.entries(dto)) {
            if (
                ['page', 'limit', 'search', 'sortBy', 'sortOrder'].includes(key) ||
                value === undefined ||
                value === null
            )
                continue;

            if (key.endsWith('Domain') && typeof value === 'string') {
                where[key.replace('Domain', '')] = { endsWith: `@${value}` };
            } else if (key.includes('Date') && typeof value === 'string') {
                where[key] = { gte: new Date(value) };
            } else if (Array.isArray(value)) {
                where[key] = { in: value };
            } else if (typeof value === 'string' && key.includes('Name')) {
                where[key] = { contains: value, mode: 'insensitive' };
            } else {
                where[key] = value;
            }
        }

        return { ...where, ...customFilters };
    }

    private buildIncludeClause(relations: string[]): any {
        const include: any = {};
        for (const relation of relations) {
            if (!relation.includes('.')) {
                include[relation] = true;
                continue;
            }
            const parts = relation.split('.');
            let curr = include;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    curr[part] = true;
                } else {
                    curr[part] = curr[part] || { include: {} };
                    curr = curr[part].include;
                }
            }
        }
        return include;
    }

    async getCount(model: string, filters?: any): Promise<number> {
        const modelAccessor = this.databaseService[model as keyof DatabaseService] as any;
        return modelAccessor.count({ where: { deletedAt: null, ...filters } });
    }
}

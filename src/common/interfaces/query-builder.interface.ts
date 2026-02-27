export interface QueryBuilderOptions {
    model: string;
    dto: any;
    defaultSort?: { field: string; order: 'asc' | 'desc' };
    searchFields?: string[];
    relations?: string[];
    customFilters?: Record<string, any>;
}

export interface PaginatedResult<T> {
    items: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface QueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

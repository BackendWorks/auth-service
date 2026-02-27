export interface IApiBaseResponse {
    statusCode: number;
    timestamp: string;
    message: string | string[];
}

export interface IApiResponse<T = any> extends IApiBaseResponse {
    data: T;
}

export interface IPaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface IPaginatedData<T> {
    items: T[];
    meta: IPaginationMeta;
}

export interface IApiPaginatedResponse<T> extends IApiBaseResponse {
    data: IPaginatedData<T>;
}

export interface IErrorResponse extends IApiBaseResponse {
    error?: string;
    stack?: string;
    path: string;
    method: string;
}

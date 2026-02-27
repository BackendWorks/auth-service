import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@backendworks/auth-db';

import { DatabaseService } from 'src/common/services/database.service';
import { QueryBuilderService } from 'src/common/services/query-builder.service';
import { QueryBuilderOptions } from 'src/common/interfaces/query-builder.interface';

describe('QueryBuilderService', () => {
    let queryBuilderService: QueryBuilderService;

    const mockUserRepository = {
        findMany: jest.fn(),
        count: jest.fn(),
    };

    const mockDatabaseService = {
        get userRepository() {
            return mockUserRepository;
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QueryBuilderService,
                { provide: DatabaseService, useValue: mockDatabaseService },
            ],
        }).compile();

        queryBuilderService = module.get<QueryBuilderService>(QueryBuilderService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findManyWithPagination', () => {
        const mockUsers = [
            {
                id: 'user-1',
                email: 'user1@example.com',
                firstName: 'User',
                lastName: 'One',
                role: Role.USER,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
                deletedAt: null,
            },
            {
                id: 'user-2',
                email: 'user2@example.com',
                firstName: 'User',
                lastName: 'Two',
                role: Role.ADMIN,
                createdAt: new Date('2023-01-02'),
                updatedAt: new Date('2023-01-02'),
                deletedAt: null,
            },
        ];

        const mockDto = {
            page: 1,
            limit: 10,
            search: 'test',
            sortBy: 'createdAt',
            sortOrder: 'desc',
        };

        const makePaginatedResult = (items: any[], total: number, page = 1, limit = 10) => ({
            items,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });

        it('should return paginated results with default options', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: mockDto,
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            const result = await queryBuilderService.findManyWithPagination(options);

            expect(result).toEqual({
                items: mockUsers,
                meta: {
                    page: 1,
                    limit: 10,
                    total: 2,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            });
            expect(mockUserRepository.findMany).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                search: 'test',
                searchFields: ['firstName', 'lastName', 'email'],
                sortBy: 'createdAt',
                sortOrder: 'desc',
                relations: [],
                customFilters: {},
            });
        });

        it('should handle custom sort options', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, sortBy: 'email', sortOrder: 'asc' },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ sortBy: 'email', sortOrder: 'asc' }),
            );
        });

        it('should handle pagination correctly', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { page: 2, limit: 5 },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 15, 2, 5));

            const result = await queryBuilderService.findManyWithPagination(options);

            expect(result.meta).toEqual({
                page: 2,
                limit: 5,
                total: 15,
                totalPages: 3,
                hasNextPage: true,
                hasPreviousPage: true,
            });
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ page: 2, limit: 5 }),
            );
        });

        it('should limit maximum page size to 100', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { page: 1, limit: 150 },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ limit: 100 }),
            );
        });

        it('should handle custom filters', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, role: Role.ADMIN },
                searchFields: ['firstName', 'lastName', 'email'],
                customFilters: { isVerified: true },
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFilters: expect.objectContaining({
                        role: Role.ADMIN,
                        isVerified: true,
                    }),
                }),
            );
        });

        it('should handle relations', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: mockDto,
                searchFields: ['firstName', 'lastName', 'email'],
                relations: ['profile', 'settings.notifications'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    relations: ['profile', 'settings.notifications'],
                }),
            );
        });

        it('should handle domain filters', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, emailDomain: 'example.com' },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFilters: expect.objectContaining({
                        email: { endsWith: '@example.com' },
                    }),
                }),
            );
        });

        it('should handle date filters', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, createdDate: '2023-01-01' },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFilters: expect.objectContaining({
                        createdDate: { gte: new Date('2023-01-01') },
                    }),
                }),
            );
        });

        it('should handle array filters', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, role: [Role.USER, Role.ADMIN] },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFilters: expect.objectContaining({
                        role: { in: [Role.USER, Role.ADMIN] },
                    }),
                }),
            );
        });

        it('should handle name filters with case insensitive search', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, firstName: 'John' },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFilters: expect.objectContaining({
                        firstName: { contains: 'John', mode: 'insensitive' },
                    }),
                }),
            );
        });

        it('should ignore pagination and search fields in customFilters', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: {
                    page: 1,
                    limit: 10,
                    search: 'test',
                    sortBy: 'email',
                    sortOrder: 'asc',
                    role: Role.USER,
                },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    sortBy: 'email',
                    sortOrder: 'asc',
                    customFilters: expect.objectContaining({ role: Role.USER }),
                }),
            );
            const callArg = mockUserRepository.findMany.mock.calls[0][0];
            expect(callArg.customFilters).not.toHaveProperty('page');
            expect(callArg.customFilters).not.toHaveProperty('limit');
            expect(callArg.customFilters).not.toHaveProperty('search');
            expect(callArg.customFilters).not.toHaveProperty('sortBy');
            expect(callArg.customFilters).not.toHaveProperty('sortOrder');
        });

        it('should handle undefined and null values in dto', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: {
                    page: 1,
                    limit: 10,
                    role: undefined,
                    isVerified: null,
                    email: 'test@example.com',
                },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));

            await queryBuilderService.findManyWithPagination(options);

            const callArg = mockUserRepository.findMany.mock.calls[0][0];
            expect(callArg.customFilters).not.toHaveProperty('role');
            expect(callArg.customFilters).not.toHaveProperty('isVerified');
            expect(callArg.customFilters).toHaveProperty('email', 'test@example.com');
        });

        it('should handle customFilters merging into query', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto },
                searchFields: ['firstName', 'lastName', 'email'],
                customFilters: { isActive: true },
            };
            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));
            await queryBuilderService.findManyWithPagination(options);
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFilters: expect.objectContaining({ isActive: true }),
                }),
            );
        });

        it('should use default searchFields when not provided', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { page: 1, limit: 10 },
            };
            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));
            await queryBuilderService.findManyWithPagination(options);
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    searchFields: undefined,
                }),
            );
        });

        it('should use default dto.page when not provided', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { limit: 10 },
                searchFields: ['firstName'],
            };
            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));
            await queryBuilderService.findManyWithPagination(options);
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ page: 1 }),
            );
        });

        it('should use default dto.limit when not provided', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { page: 1 },
                searchFields: ['firstName'],
            };
            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));
            await queryBuilderService.findManyWithPagination(options);
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ limit: 10 }),
            );
        });

        it('should handle dto with property ending with Name', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, lastName: 'Smith' },
                searchFields: ['firstName', 'lastName', 'email'],
            };
            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));
            await queryBuilderService.findManyWithPagination(options);
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFilters: expect.objectContaining({
                        lastName: { contains: 'Smith', mode: 'insensitive' },
                    }),
                }),
            );
        });

        it('should handle dto with property containing Date', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, updatedDate: '2023-01-05' },
                searchFields: ['firstName', 'lastName', 'email'],
            };
            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));
            await queryBuilderService.findManyWithPagination(options);
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFilters: expect.objectContaining({
                        updatedDate: { gte: new Date('2023-01-05') },
                    }),
                }),
            );
        });

        it('should handle non-string scalar values in dto (else branch)', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { page: 1, limit: 10, isVerified: true },
                searchFields: ['firstName', 'lastName', 'email'],
            };
            mockUserRepository.findMany.mockResolvedValue(makePaginatedResult(mockUsers, 2));
            await queryBuilderService.findManyWithPagination(options);
            expect(mockUserRepository.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFilters: expect.objectContaining({ isVerified: true }),
                }),
            );
        });
    });

    describe('getCount', () => {
        it('should return count with no filters', async () => {
            mockUserRepository.count.mockResolvedValue(10);

            const result = await queryBuilderService.getCount('user');

            expect(result).toBe(10);
            expect(mockUserRepository.count).toHaveBeenCalledWith(undefined);
        });

        it('should return count with custom filters', async () => {
            const filters = { role: Role.ADMIN, isVerified: true };
            mockUserRepository.count.mockResolvedValue(5);

            const result = await queryBuilderService.getCount('user', filters);

            expect(result).toBe(5);
            expect(mockUserRepository.count).toHaveBeenCalledWith(filters);
        });
    });
});

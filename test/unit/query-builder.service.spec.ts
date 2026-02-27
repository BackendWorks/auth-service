import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';

import { DatabaseService } from 'src/common/services/database.service';
import { QueryBuilderService } from 'src/common/services/query-builder.service';
import { QueryBuilderOptions } from 'src/common/interfaces/query-builder.interface';

describe('QueryBuilderService', () => {
    let queryBuilderService: QueryBuilderService;

    const mockDatabaseService = {
        user: {
            findMany: jest.fn(),
            count: jest.fn(),
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

        it('should return paginated results with default options', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: mockDto,
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

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
            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
            expect(mockDatabaseService.user.count).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                },
            });
        });

        it('should handle custom sort options', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, sortBy: 'email', sortOrder: 'asc' },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                },
                skip: 0,
                take: 10,
                orderBy: { email: 'asc' },
            });
        });

        it('should handle pagination correctly', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { page: 2, limit: 5 },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(15);

            const result = await queryBuilderService.findManyWithPagination(options);

            expect(result.meta).toEqual({
                page: 2,
                limit: 5,
                total: 15,
                totalPages: 3,
                hasNextPage: true,
                hasPreviousPage: true,
            });
            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                skip: 5,
                take: 5,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should limit maximum page size to 100', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { page: 1, limit: 150 },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                skip: 0,
                take: 100,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should handle custom filters', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, role: Role.ADMIN },
                searchFields: ['firstName', 'lastName', 'email'],
                customFilters: { isVerified: true },
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                    role: Role.ADMIN,
                    isVerified: true,
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should handle relations in include clause', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: mockDto,
                searchFields: ['firstName', 'lastName', 'email'],
                relations: ['profile', 'settings.notifications'],
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    profile: true,
                    settings: {
                        include: {
                            notifications: true,
                        },
                    },
                },
            });
        });

        it('should handle domain filters', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, emailDomain: 'example.com' },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                    email: { endsWith: '@example.com' },
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should handle date filters', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, createdDate: '2023-01-01' },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                    createdDate: { gte: new Date('2023-01-01') },
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should handle array filters', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, role: [Role.USER, Role.ADMIN] },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                    role: { in: [Role.USER, Role.ADMIN] },
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should handle name filters with case insensitive search', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, firstName: 'John' },
                searchFields: ['firstName', 'lastName', 'email'],
            };

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                    firstName: { contains: 'John', mode: 'insensitive' },
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should ignore pagination and search fields in where clause', async () => {
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

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    OR: [
                        { firstName: { contains: 'test', mode: 'insensitive' } },
                        { lastName: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                    ],
                    role: Role.USER,
                },
                skip: 0,
                take: 10,
                orderBy: { email: 'asc' },
            });
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

            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);

            await queryBuilderService.findManyWithPagination(options);

            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    email: 'test@example.com',
                },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should handle customFilters merging into whereClause', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto },
                searchFields: ['firstName', 'lastName', 'email'],
                customFilters: { isActive: true },
            };
            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);
            await queryBuilderService.findManyWithPagination(options);
            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ isActive: true }),
                }),
            );
        });

        it('should use default searchFields when not provided', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { page: 1, limit: 10 },
            };
            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);
            await queryBuilderService.findManyWithPagination(options);
            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { deletedAt: null },
                }),
            );
        });

        it('should use default dto.page when not provided', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { limit: 10 },
                searchFields: ['firstName'],
            };
            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);
            await queryBuilderService.findManyWithPagination(options);
            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 0,
                }),
            );
        });

        it('should use default dto.limit when not provided', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { page: 1 },
                searchFields: ['firstName'],
            };
            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);
            await queryBuilderService.findManyWithPagination(options);
            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 10,
                }),
            );
        });

        it('should handle dto with property ending with Name', async () => {
            const options: QueryBuilderOptions = {
                model: 'user',
                dto: { ...mockDto, lastName: 'Smith' },
                searchFields: ['firstName', 'lastName', 'email'],
            };
            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);
            await queryBuilderService.findManyWithPagination(options);
            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
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
            mockDatabaseService.user.findMany.mockResolvedValue(mockUsers);
            mockDatabaseService.user.count.mockResolvedValue(2);
            await queryBuilderService.findManyWithPagination(options);
            expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        updatedDate: { gte: new Date('2023-01-05') },
                    }),
                }),
            );
        });
    });

    describe('getCount', () => {
        it('should return count with default filters', async () => {
            mockDatabaseService.user.count.mockResolvedValue(10);

            const result = await queryBuilderService.getCount('user');

            expect(result).toBe(10);
            expect(mockDatabaseService.user.count).toHaveBeenCalledWith({
                where: { deletedAt: null },
            });
        });

        it('should return count with custom filters', async () => {
            const filters = { role: Role.ADMIN, isVerified: true };
            mockDatabaseService.user.count.mockResolvedValue(5);

            const result = await queryBuilderService.getCount('user', filters);

            expect(result).toBe(5);
            expect(mockDatabaseService.user.count).toHaveBeenCalledWith({
                where: { deletedAt: null, ...filters },
            });
        });
    });
});

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@backendworks/auth-db';

import { DatabaseService } from 'src/common/services/database.service';
import { QueryBuilderService } from 'src/common/services/query-builder.service';
import { UserListDto } from 'src/modules/user/dtos/user-list.dto';
import { UserResponseDto } from 'src/modules/user/dtos/user.response.dto';
import { UserAdminService } from 'src/modules/user/services/user.admin.service';

describe('UserAdminService', () => {
    let userAdminService: UserAdminService;
    let queryBuilderService: QueryBuilderService;

    const mockUserRepository = {
        findById: jest.fn(),
        softDelete: jest.fn(),
    };

    const mockDatabaseService = {
        userRepository: mockUserRepository,
    };

    const mockQueryBuilderService = {
        findManyWithPagination: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserAdminService,
                { provide: DatabaseService, useValue: mockDatabaseService },
                { provide: QueryBuilderService, useValue: mockQueryBuilderService },
            ],
        }).compile();

        userAdminService = module.get<UserAdminService>(UserAdminService);
        queryBuilderService = module.get<QueryBuilderService>(QueryBuilderService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('listUsers', () => {
        const mockListDto: UserListDto = {
            page: 1,
            limit: 10,
            search: 'test',
            sortBy: 'createdAt',
            sortOrder: 'desc',
        };

        const mockPaginatedResult = {
            items: [
                {
                    id: 'user-1',
                    email: 'user1@example.com',
                    firstName: 'User',
                    lastName: 'One',
                    role: Role.USER,
                    isVerified: true,
                    phoneNumber: null,
                    avatar: null,
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
                    isVerified: false,
                    phoneNumber: '+1234567890',
                    avatar: 'https://example.com/avatar.jpg',
                    createdAt: new Date('2023-01-02'),
                    updatedAt: new Date('2023-01-02'),
                    deletedAt: null,
                },
            ],
            meta: {
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };

        it('should return paginated users list', async () => {
            jest.spyOn(queryBuilderService, 'findManyWithPagination').mockResolvedValue(
                mockPaginatedResult,
            );

            const result = await userAdminService.listUsers(mockListDto);

            expect(result).toEqual(mockPaginatedResult);
            expect(queryBuilderService.findManyWithPagination).toHaveBeenCalledWith({
                model: 'user',
                dto: mockListDto,
                defaultSort: { field: 'createdAt', order: 'desc' },
                searchFields: ['firstName', 'lastName', 'email'],
            });
        });

        it('should handle empty search criteria', async () => {
            const emptyListDto: UserListDto = { page: 1, limit: 10 };
            jest.spyOn(queryBuilderService, 'findManyWithPagination').mockResolvedValue(
                mockPaginatedResult,
            );

            await userAdminService.listUsers(emptyListDto);

            expect(queryBuilderService.findManyWithPagination).toHaveBeenCalledWith({
                model: 'user',
                dto: emptyListDto,
                defaultSort: { field: 'createdAt', order: 'desc' },
                searchFields: ['firstName', 'lastName', 'email'],
            });
        });
    });

    describe('deleteUser', () => {
        const userId = 'user-123';
        const mockUser: UserResponseDto = {
            id: userId,
            email: 'test@example.com',
            password: 'hashedPassword',
            role: Role.USER,
            firstName: 'Test',
            lastName: 'User',
            isVerified: true,
            phoneNumber: null,
            avatar: null,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-02'),
            deletedAt: null,
        };

        it('should soft delete user successfully', async () => {
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockUserRepository.softDelete.mockResolvedValue({ ...mockUser, deletedAt: new Date() });

            await userAdminService.deleteUser(userId);

            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
            expect(mockUserRepository.softDelete).toHaveBeenCalledWith(userId);
        });

        it('should throw NotFoundException when user does not exist', async () => {
            mockUserRepository.findById.mockResolvedValue(null);

            await expect(userAdminService.deleteUser(userId)).rejects.toThrow(
                new NotFoundException('User not found'),
            );
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
            expect(mockUserRepository.softDelete).not.toHaveBeenCalled();
        });

        it('should handle database errors during user lookup', async () => {
            const mockError = new Error('Database connection failed');
            mockUserRepository.findById.mockRejectedValue(mockError);

            await expect(userAdminService.deleteUser(userId)).rejects.toThrow(
                'Database connection failed',
            );
        });

        it('should handle database errors during soft delete', async () => {
            const mockError = new Error('Delete failed');
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockUserRepository.softDelete.mockRejectedValue(mockError);

            await expect(userAdminService.deleteUser(userId)).rejects.toThrow('Delete failed');
        });
    });
});

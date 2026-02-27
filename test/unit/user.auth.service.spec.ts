import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';

import { DatabaseService } from 'src/common/services/database.service';
import { UserResponseDto } from 'src/modules/user/dtos/user.response.dto';
import { UserUpdateDto } from 'src/modules/user/dtos/user.update.dto';
import { UserAuthService } from 'src/modules/user/services/user.auth.service';

describe('UserAuthService', () => {
    let userAuthService: UserAuthService;
    let databaseService: DatabaseService;

    const mockDatabaseService = {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserAuthService,
                { provide: DatabaseService, useValue: mockDatabaseService },
            ],
        }).compile();

        userAuthService = module.get<UserAuthService>(UserAuthService);
        databaseService = module.get<DatabaseService>(DatabaseService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserProfile', () => {
        const userId = 'user-123';
        const mockUser: UserResponseDto = {
            id: userId,
            email: 'test@example.com',
            password: 'hashedPassword',
            role: Role.USER,
            firstName: 'Test',
            lastName: 'User',
            isVerified: true,
            phoneNumber: '+1234567890',
            avatar: 'https://example.com/avatar.jpg',
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-02'),
            deletedAt: null,
        };

        it('should return user profile when user exists', async () => {
            jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(mockUser);

            const result = await userAuthService.getUserProfile(userId);

            expect(result).toEqual(mockUser);
            expect(databaseService.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId, deletedAt: null },
            });
        });

        it('should throw NotFoundException when user does not exist', async () => {
            jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null);

            await expect(userAuthService.getUserProfile(userId)).rejects.toThrow(
                new NotFoundException('User not found'),
            );
            expect(databaseService.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId, deletedAt: null },
            });
        });

        it('should throw NotFoundException when user is soft deleted', async () => {
            jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null);

            await expect(userAuthService.getUserProfile(userId)).rejects.toThrow(
                new NotFoundException('User not found'),
            );
        });
    });

    describe('getUserProfileByEmail', () => {
        const email = 'test@example.com';
        const mockUser: UserResponseDto = {
            id: 'user-123',
            email,
            password: 'hashedPassword',
            role: Role.USER,
            firstName: 'Test',
            lastName: 'User',
            isVerified: true,
            phoneNumber: '+1234567890',
            avatar: 'https://example.com/avatar.jpg',
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-02'),
            deletedAt: null,
        };

        it('should return user profile when user exists with email', async () => {
            jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(mockUser);

            const result = await userAuthService.getUserProfileByEmail(email);

            expect(result).toEqual(mockUser);
            expect(databaseService.user.findUnique).toHaveBeenCalledWith({
                where: { email, deletedAt: null },
            });
        });

        it('should throw NotFoundException when user does not exist with email', async () => {
            jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null);

            await expect(userAuthService.getUserProfileByEmail(email)).rejects.toThrow(
                new NotFoundException('User not found'),
            );
            expect(databaseService.user.findUnique).toHaveBeenCalledWith({
                where: { email, deletedAt: null },
            });
        });

        it('should throw NotFoundException when user with email is soft deleted', async () => {
            jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null);

            await expect(userAuthService.getUserProfileByEmail(email)).rejects.toThrow(
                new NotFoundException('User not found'),
            );
        });
    });

    describe('updateUserProfile', () => {
        const userId = 'user-123';
        const updateDto: UserUpdateDto = {
            firstName: 'Updated',
            lastName: 'Name',
            email: 'updated@example.com',
            phoneNumber: '+9876543210',
            avatar: 'https://example.com/new-avatar.jpg',
        };

        const existingUser: UserResponseDto = {
            id: userId,
            email: 'old@example.com',
            password: 'hashedPassword',
            role: Role.USER,
            firstName: 'Old',
            lastName: 'Name',
            isVerified: true,
            phoneNumber: '+1234567890',
            avatar: 'https://example.com/old-avatar.jpg',
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-02'),
            deletedAt: null,
        };

        const updatedUser: UserResponseDto = {
            ...existingUser,
            ...updateDto,
            updatedAt: new Date('2023-01-03'),
        };

        it('should update user profile successfully', async () => {
            jest.spyOn(userAuthService, 'getUserProfile').mockResolvedValue(existingUser);
            jest.spyOn(databaseService.user, 'update').mockResolvedValue(updatedUser);

            const result = await userAuthService.updateUserProfile(userId, updateDto);

            expect(result).toEqual(updatedUser);
            expect(userAuthService.getUserProfile).toHaveBeenCalledWith(userId);
            expect(databaseService.user.update).toHaveBeenCalledWith({
                where: { id: existingUser.id },
                data: {
                    firstName: updateDto.firstName?.trim(),
                    lastName: updateDto.lastName?.trim(),
                    email: updateDto.email,
                    phoneNumber: updateDto.phoneNumber,
                    avatar: updateDto.avatar,
                },
            });
        });

        it('should handle whitespace trimming in firstName and lastName', async () => {
            const updateDtoWithWhitespace: UserUpdateDto = {
                firstName: '  Updated  ',
                lastName: '  Name  ',
                email: 'updated@example.com',
            };

            jest.spyOn(userAuthService, 'getUserProfile').mockResolvedValue(existingUser);
            jest.spyOn(databaseService.user, 'update').mockResolvedValue(updatedUser);

            await userAuthService.updateUserProfile(userId, updateDtoWithWhitespace);

            expect(databaseService.user.update).toHaveBeenCalledWith({
                where: { id: existingUser.id },
                data: {
                    firstName: 'Updated',
                    lastName: 'Name',
                    email: updateDtoWithWhitespace.email,
                    phoneNumber: updateDtoWithWhitespace.phoneNumber,
                    avatar: updateDtoWithWhitespace.avatar,
                },
            });
        });

        it('should handle null values in updateDto', async () => {
            const updateDtoWithNulls: UserUpdateDto = {
                firstName: null,
                lastName: null,
                email: 'updated@example.com',
                phoneNumber: null,
                avatar: null,
            };

            jest.spyOn(userAuthService, 'getUserProfile').mockResolvedValue(existingUser);
            jest.spyOn(databaseService.user, 'update').mockResolvedValue(updatedUser);

            await userAuthService.updateUserProfile(userId, updateDtoWithNulls);

            expect(databaseService.user.update).toHaveBeenCalledWith({
                where: { id: existingUser.id },
                data: {
                    firstName: undefined,
                    lastName: undefined,
                    email: updateDtoWithNulls.email,
                    phoneNumber: null,
                    avatar: null,
                },
            });
        });

        it('should throw NotFoundException when user does not exist', async () => {
            jest.spyOn(userAuthService, 'getUserProfile').mockRejectedValue(
                new NotFoundException('User not found'),
            );

            await expect(userAuthService.updateUserProfile(userId, updateDto)).rejects.toThrow(
                new NotFoundException('User not found'),
            );
            expect(userAuthService.getUserProfile).toHaveBeenCalledWith(userId);
        });
    });

    describe('createUser', () => {
        const userData = {
            email: 'newuser@example.com',
            firstName: 'New',
            lastName: 'User',
            password: 'hashedPassword',
            phoneNumber: '+1234567890',
            avatar: 'https://example.com/avatar.jpg',
        };

        const createdUser: UserResponseDto = {
            id: 'new-user-123',
            email: userData.email,
            password: userData.password,
            role: Role.USER,
            firstName: userData.firstName,
            lastName: userData.lastName,
            isVerified: false,
            phoneNumber: userData.phoneNumber,
            avatar: userData.avatar,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
            deletedAt: null,
        };

        it('should create user successfully with all fields', async () => {
            jest.spyOn(databaseService.user, 'create').mockResolvedValue(createdUser);

            const result = await userAuthService.createUser(userData);

            expect(result).toEqual(createdUser);
            expect(databaseService.user.create).toHaveBeenCalledWith({
                data: {
                    email: userData.email,
                    firstName: userData.firstName?.trim(),
                    lastName: userData.lastName?.trim(),
                    phoneNumber: userData.phoneNumber,
                    avatar: userData.avatar,
                    password: userData.password,
                    role: Role.USER,
                },
            });
        });

        it('should create user with minimal data', async () => {
            const minimalUserData = {
                email: 'minimal@example.com',
                password: 'hashedPassword',
            };

            const minimalCreatedUser: UserResponseDto = {
                id: 'minimal-user-123',
                email: minimalUserData.email,
                password: minimalUserData.password,
                role: Role.USER,
                firstName: '',
                lastName: '',
                isVerified: false,
                phoneNumber: null,
                avatar: null,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
                deletedAt: null,
            };

            jest.spyOn(databaseService.user, 'create').mockResolvedValue(minimalCreatedUser);

            const result = await userAuthService.createUser(minimalUserData);

            expect(result).toEqual(minimalCreatedUser);
            expect(databaseService.user.create).toHaveBeenCalledWith({
                data: {
                    email: minimalUserData.email,
                    firstName: '',
                    lastName: '',
                    phoneNumber: undefined,
                    avatar: undefined,
                    password: minimalUserData.password,
                    role: Role.USER,
                },
            });
        });

        it('should handle whitespace trimming in firstName and lastName', async () => {
            const userDataWithWhitespace = {
                ...userData,
                firstName: '  New  ',
                lastName: '  User  ',
            };

            jest.spyOn(databaseService.user, 'create').mockResolvedValue(createdUser);

            await userAuthService.createUser(userDataWithWhitespace);

            expect(databaseService.user.create).toHaveBeenCalledWith({
                data: {
                    email: userDataWithWhitespace.email,
                    firstName: 'New',
                    lastName: 'User',
                    phoneNumber: userDataWithWhitespace.phoneNumber,
                    avatar: userDataWithWhitespace.avatar,
                    password: userDataWithWhitespace.password,
                    role: Role.USER,
                },
            });
        });

        it('should handle null values in userData', async () => {
            const userDataWithNulls = {
                email: 'nulluser@example.com',
                password: 'hashedPassword',
                firstName: null,
                lastName: null,
                phoneNumber: null,
                avatar: null,
            };

            const createdUserWithNulls: UserResponseDto = {
                id: 'null-user-123',
                email: userDataWithNulls.email,
                password: userDataWithNulls.password,
                role: Role.USER,
                firstName: '',
                lastName: '',
                isVerified: false,
                phoneNumber: null,
                avatar: null,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
                deletedAt: null,
            };

            jest.spyOn(databaseService.user, 'create').mockResolvedValue(createdUserWithNulls);

            const result = await userAuthService.createUser(userDataWithNulls);

            expect(result).toEqual(createdUserWithNulls);
            expect(databaseService.user.create).toHaveBeenCalledWith({
                data: {
                    email: userDataWithNulls.email,
                    firstName: '',
                    lastName: '',
                    phoneNumber: null,
                    avatar: null,
                    password: userDataWithNulls.password,
                    role: Role.USER,
                },
            });
        });
    });
});

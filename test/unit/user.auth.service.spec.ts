import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseService } from 'src/common/services/database.service';
import { UserResponseDto } from 'src/modules/user/dtos/user.response.dto';
import { UserUpdateDto } from 'src/modules/user/dtos/user.update.dto';
import { UserAuthService } from 'src/modules/user/services/user.auth.service';

describe('UserAuthService', () => {
    let userAuthService: UserAuthService;

    const mockUserRepository = {
        findById: jest.fn(),
        findByEmail: jest.fn(),
        findOne: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        count: jest.fn(),
    };

    const mockDatabaseService = {
        userRepository: mockUserRepository,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserAuthService,
                { provide: DatabaseService, useValue: mockDatabaseService },
            ],
        }).compile();

        userAuthService = module.get<UserAuthService>(UserAuthService);
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
            role: 'USER',
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
            mockUserRepository.findById.mockResolvedValue(mockUser);

            const result = await userAuthService.getUserProfile(userId);

            expect(result).toEqual(mockUser);
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
        });

        it('should return null when user does not exist', async () => {
            mockUserRepository.findById.mockResolvedValue(null);

            const result = await userAuthService.getUserProfile(userId);

            expect(result).toBeNull();
            expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
        });
    });

    describe('getUserProfileByEmail', () => {
        const email = 'test@example.com';
        const mockUser: UserResponseDto = {
            id: 'user-123',
            email,
            password: 'hashedPassword',
            role: 'USER',
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
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);

            const result = await userAuthService.getUserProfileByEmail(email);

            expect(result).toEqual(mockUser);
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
        });

        it('should return null when user does not exist with email', async () => {
            mockUserRepository.findByEmail.mockResolvedValue(null);

            const result = await userAuthService.getUserProfileByEmail(email);

            expect(result).toBeNull();
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
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
            role: 'USER',
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
            mockUserRepository.update.mockResolvedValue(updatedUser);

            const result = await userAuthService.updateUserProfile(userId, updateDto);

            expect(result).toEqual(updatedUser);
            expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
                firstName: updateDto.firstName?.trim(),
                lastName: updateDto.lastName?.trim(),
                email: updateDto.email,
                phoneNumber: updateDto.phoneNumber,
                avatar: updateDto.avatar,
            });
        });

        it('should handle whitespace trimming in firstName and lastName', async () => {
            const updateDtoWithWhitespace: UserUpdateDto = {
                firstName: '  Updated  ',
                lastName: '  Name  ',
                email: 'updated@example.com',
            };

            mockUserRepository.update.mockResolvedValue(updatedUser);

            await userAuthService.updateUserProfile(userId, updateDtoWithWhitespace);

            expect(mockUserRepository.update).toHaveBeenCalledWith(userId, {
                firstName: 'Updated',
                lastName: 'Name',
                email: updateDtoWithWhitespace.email,
                phoneNumber: updateDtoWithWhitespace.phoneNumber,
                avatar: updateDtoWithWhitespace.avatar,
            });
        });

        it('should throw error when update fails', async () => {
            const mockError = new Error('Update failed');
            mockUserRepository.update.mockRejectedValue(mockError);

            await expect(userAuthService.updateUserProfile(userId, updateDto)).rejects.toThrow(
                'Update failed',
            );
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
            role: 'USER',
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
            mockUserRepository.create.mockResolvedValue(createdUser);

            const result = await userAuthService.createUser(userData);

            expect(result).toEqual(createdUser);
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                email: userData.email,
                firstName: userData.firstName?.trim(),
                lastName: userData.lastName?.trim(),
                phoneNumber: userData.phoneNumber,
                avatar: userData.avatar,
                password: userData.password,
                role: 'USER',
            });
        });

        it('should create user with minimal data', async () => {
            const minimalUserData = { email: 'minimal@example.com', password: 'hashedPassword' };
            const minimalCreatedUser = {
                ...createdUser,
                id: 'minimal-user-123',
                email: minimalUserData.email,
                firstName: '',
                lastName: '',
                phoneNumber: null,
                avatar: null,
            };

            mockUserRepository.create.mockResolvedValue(minimalCreatedUser);

            const result = await userAuthService.createUser(minimalUserData);

            expect(result).toEqual(minimalCreatedUser);
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                email: minimalUserData.email,
                firstName: '',
                lastName: '',
                phoneNumber: undefined,
                avatar: undefined,
                password: minimalUserData.password,
                role: 'USER',
            });
        });

        it('should handle whitespace trimming in firstName and lastName', async () => {
            const userDataWithWhitespace = {
                ...userData,
                firstName: '  New  ',
                lastName: '  User  ',
            };
            mockUserRepository.create.mockResolvedValue(createdUser);

            await userAuthService.createUser(userDataWithWhitespace);

            expect(mockUserRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ firstName: 'New', lastName: 'User' }),
            );
        });
    });
});

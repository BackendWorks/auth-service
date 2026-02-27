import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';

import { HashService } from 'src/common/services/hash.service';
import { AuthLoginDto } from 'src/modules/auth/dtos/auth.login.dto';
import { AuthSignupDto } from 'src/modules/auth/dtos/auth.signup.dto';
import {
    IAuthPayload,
    ITokenResponse,
    TokenType,
} from 'src/modules/auth/interfaces/auth.interface';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { UserResponseDto } from 'src/modules/user/dtos/user.response.dto';
import { UserAuthService } from 'src/modules/user/services/user.auth.service';

describe('AuthService', () => {
    let authService: AuthService;
    let jwtService: JwtService;
    let userAuthService: UserAuthService;
    let hashService: HashService;

    const mockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
            switch (key) {
                case 'auth.accessToken.secret':
                    return 'access-secret-key-32-chars-minimum';
                case 'auth.refreshToken.secret':
                    return 'refresh-secret-key-32-chars-minimum';
                case 'auth.accessToken.expirationTime':
                    return '15m';
                case 'auth.refreshToken.expirationTime':
                    return '7d';
                default:
                    return null;
            }
        }),
    };

    const mockJwtService = {
        signAsync: jest.fn(),
        verifyAsync: jest.fn(),
    };

    const mockUserAuthService = {
        getUserProfileByEmail: jest.fn(),
        createUser: jest.fn(),
    };

    const mockHashService = {
        match: jest.fn(),
        createHash: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: UserAuthService, useValue: mockUserAuthService },
                { provide: HashService, useValue: mockHashService },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
        userAuthService = module.get<UserAuthService>(UserAuthService);
        hashService = module.get<HashService>(HashService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('verifyToken', () => {
        it('should verify a valid token and return decoded payload', async () => {
            const mockToken = 'valid.jwt.token';
            const mockPayload: IAuthPayload = {
                id: 'user-123',
                role: Role.USER,
                tokenType: TokenType.ACCESS_TOKEN,
            };

            jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

            const result = await authService.verifyToken(mockToken);

            expect(result).toEqual(mockPayload);
            expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
                secret: 'access-secret-key-32-chars-minimum',
            });
        });

        it('should throw an error if token verification fails', async () => {
            const mockToken = 'invalid.jwt.token';
            const mockError = new Error('Invalid token');

            jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(mockError);

            await expect(authService.verifyToken(mockToken)).rejects.toThrow('Invalid token');
            expect(jwtService.verifyAsync).toHaveBeenCalledWith(mockToken, {
                secret: 'access-secret-key-32-chars-minimum',
            });
        });
    });

    describe('generateTokens', () => {
        it('should generate access and refresh tokens successfully', async () => {
            const mockUser: IAuthPayload = {
                id: 'user-123',
                role: Role.USER,
            };
            const accessToken = 'access.jwt.token';
            const refreshToken = 'refresh.jwt.token';

            jest.spyOn(jwtService, 'signAsync')
                .mockResolvedValueOnce(accessToken)
                .mockResolvedValueOnce(refreshToken);

            const result = await authService.generateTokens(mockUser);

            expect(result).toEqual({ accessToken, refreshToken });
            expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
            expect(jwtService.signAsync).toHaveBeenNthCalledWith(
                1,
                { id: mockUser.id, role: mockUser.role, tokenType: TokenType.ACCESS_TOKEN },
                { secret: 'access-secret-key-32-chars-minimum', expiresIn: '15m' },
            );
            expect(jwtService.signAsync).toHaveBeenNthCalledWith(
                2,
                { id: mockUser.id, role: mockUser.role, tokenType: TokenType.REFRESH_TOKEN },
                { secret: 'refresh-secret-key-32-chars-minimum', expiresIn: '7d' },
            );
        });

        it('should handle token generation errors', async () => {
            const mockUser: IAuthPayload = {
                id: 'user-123',
                role: Role.USER,
            };
            const mockError = new Error('Token generation failed');

            jest.spyOn(jwtService, 'signAsync').mockRejectedValue(mockError);

            await expect(authService.generateTokens(mockUser)).rejects.toThrow(
                'Token generation failed',
            );
        });
    });

    describe('login', () => {
        const mockLoginDto: AuthLoginDto = {
            email: 'test@example.com',
            password: 'password123',
        };

        it('should throw NotFoundException if user does not exist', async () => {
            jest.spyOn(userAuthService, 'getUserProfileByEmail').mockResolvedValue(null);

            await expect(authService.login(mockLoginDto)).rejects.toThrow(
                new NotFoundException('User not found'),
            );
            expect(userAuthService.getUserProfileByEmail).toHaveBeenCalledWith(mockLoginDto.email);
        });

        it('should throw NotFoundException if password is invalid', async () => {
            const mockUser: UserResponseDto = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashedPassword',
                role: Role.USER,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                phoneNumber: null,
                avatar: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            jest.spyOn(userAuthService, 'getUserProfileByEmail').mockResolvedValue(mockUser);
            jest.spyOn(hashService, 'match').mockReturnValue(false);

            await expect(authService.login(mockLoginDto)).rejects.toThrow(
                new NotFoundException('Invalid password'),
            );
            expect(hashService.match).toHaveBeenCalledWith(
                mockUser.password,
                mockLoginDto.password,
            );
        });

        it('should return tokens and user data on successful login', async () => {
            const mockUser: UserResponseDto = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashedPassword',
                role: Role.USER,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                phoneNumber: null,
                avatar: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };
            const mockTokens: ITokenResponse = {
                accessToken: 'access.jwt.token',
                refreshToken: 'refresh.jwt.token',
            };

            jest.spyOn(userAuthService, 'getUserProfileByEmail').mockResolvedValue(mockUser);
            jest.spyOn(hashService, 'match').mockReturnValue(true);
            jest.spyOn(authService, 'generateTokens').mockResolvedValue(mockTokens);

            const result = await authService.login(mockLoginDto);

            expect(result).toEqual({
                ...mockTokens,
                user: mockUser,
            });
            expect(userAuthService.getUserProfileByEmail).toHaveBeenCalledWith(mockLoginDto.email);
            expect(hashService.match).toHaveBeenCalledWith(
                mockUser.password,
                mockLoginDto.password,
            );
            expect(authService.generateTokens).toHaveBeenCalledWith({
                id: mockUser.id,
                role: mockUser.role,
            });
        });
    });

    describe('signup', () => {
        const mockSignupDto: AuthSignupDto = {
            email: 'newuser@example.com',
            firstName: 'New',
            lastName: 'User',
            password: 'password123',
        };

        it('should throw ConflictException if user already exists', async () => {
            const existingUser: UserResponseDto = {
                id: 'existing-user',
                email: 'newuser@example.com',
                password: 'hashedPassword',
                role: Role.USER,
                firstName: 'Existing',
                lastName: 'User',
                isVerified: true,
                phoneNumber: null,
                avatar: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            jest.spyOn(userAuthService, 'getUserProfileByEmail').mockResolvedValue(existingUser);

            await expect(authService.signup(mockSignupDto)).rejects.toThrow(
                new ConflictException('User already exists with this email'),
            );
            expect(userAuthService.getUserProfileByEmail).toHaveBeenCalledWith(mockSignupDto.email);
        });

        it('should create new user and return tokens on successful signup', async () => {
            const hashedPassword = 'hashedPassword123';
            const createdUser: UserResponseDto = {
                id: 'new-user-123',
                email: 'newuser@example.com',
                password: hashedPassword,
                role: Role.USER,
                firstName: 'New',
                lastName: 'User',
                isVerified: false,
                phoneNumber: null,
                avatar: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };
            const mockTokens: ITokenResponse = {
                accessToken: 'access.jwt.token',
                refreshToken: 'refresh.jwt.token',
            };

            jest.spyOn(userAuthService, 'getUserProfileByEmail').mockResolvedValue(null);
            jest.spyOn(hashService, 'createHash').mockReturnValue(hashedPassword);
            jest.spyOn(userAuthService, 'createUser').mockResolvedValue(createdUser);
            jest.spyOn(authService, 'generateTokens').mockResolvedValue(mockTokens);

            const result = await authService.signup(mockSignupDto);

            expect(result).toEqual({
                ...mockTokens,
                user: createdUser,
            });
            expect(userAuthService.getUserProfileByEmail).toHaveBeenCalledWith(mockSignupDto.email);
            expect(hashService.createHash).toHaveBeenCalledWith(mockSignupDto.password);
            expect(userAuthService.createUser).toHaveBeenCalledWith({
                email: mockSignupDto.email,
                firstName: mockSignupDto.firstName,
                lastName: mockSignupDto.lastName,
                password: hashedPassword,
            });
            expect(authService.generateTokens).toHaveBeenCalledWith({
                id: createdUser.id,
                role: createdUser.role,
            });
        });

        it('should handle missing firstName and lastName in signup', async () => {
            const signupDtoWithoutNames: AuthSignupDto = {
                email: 'newuser@example.com',
                password: 'password123',
            };
            const hashedPassword = 'hashedPassword123';
            const createdUser: UserResponseDto = {
                id: 'new-user-123',
                email: 'newuser@example.com',
                password: hashedPassword,
                role: Role.USER,
                firstName: '',
                lastName: '',
                isVerified: false,
                phoneNumber: null,
                avatar: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };
            const mockTokens: ITokenResponse = {
                accessToken: 'access.jwt.token',
                refreshToken: 'refresh.jwt.token',
            };

            jest.spyOn(userAuthService, 'getUserProfileByEmail').mockResolvedValue(null);
            jest.spyOn(hashService, 'createHash').mockReturnValue(hashedPassword);
            jest.spyOn(userAuthService, 'createUser').mockResolvedValue(createdUser);
            jest.spyOn(authService, 'generateTokens').mockResolvedValue(mockTokens);

            const result = await authService.signup(signupDtoWithoutNames);

            expect(result).toEqual({
                ...mockTokens,
                user: createdUser,
            });
            expect(userAuthService.createUser).toHaveBeenCalledWith({
                email: signupDtoWithoutNames.email,
                firstName: '',
                lastName: '',
                password: hashedPassword,
            });
        });

        it('should throw error if user creation fails', async () => {
            const hashedPassword = 'hashedPassword123';

            jest.spyOn(userAuthService, 'getUserProfileByEmail').mockResolvedValue(null);
            jest.spyOn(hashService, 'createHash').mockReturnValue(hashedPassword);
            jest.spyOn(userAuthService, 'createUser').mockResolvedValue(null);

            await expect(authService.signup(mockSignupDto)).rejects.toThrow(
                'Failed to create user',
            );
        });

        it('should throw error if created user is missing required fields', async () => {
            const hashedPassword = 'hashedPassword123';
            const incompleteUser = {
                id: 'new-user-123',
                email: 'newuser@example.com',
                // Missing role
            };

            jest.spyOn(userAuthService, 'getUserProfileByEmail').mockResolvedValue(null);
            jest.spyOn(hashService, 'createHash').mockReturnValue(hashedPassword);
            jest.spyOn(userAuthService, 'createUser').mockResolvedValue(
                incompleteUser as UserResponseDto,
            );

            await expect(authService.signup(mockSignupDto)).rejects.toThrow(
                'Failed to create user',
            );
        });
    });

    describe('Configuration fallbacks', () => {
        it('should use empty string fallback when config values are null', async () => {
            const mockConfigServiceWithNulls = {
                get: jest.fn().mockReturnValue(null),
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    AuthService,
                    { provide: ConfigService, useValue: mockConfigServiceWithNulls },
                    { provide: JwtService, useValue: mockJwtService },
                    { provide: UserAuthService, useValue: mockUserAuthService },
                    { provide: HashService, useValue: mockHashService },
                ],
            }).compile();

            const authServiceWithNulls = module.get<AuthService>(AuthService);
            expect(authServiceWithNulls).toBeDefined();
        });

        it('should use empty string fallback when config values are undefined', async () => {
            const mockConfigServiceWithUndefined = {
                get: jest.fn().mockReturnValue(undefined),
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    AuthService,
                    { provide: ConfigService, useValue: mockConfigServiceWithUndefined },
                    { provide: JwtService, useValue: mockJwtService },
                    { provide: UserAuthService, useValue: mockUserAuthService },
                    { provide: HashService, useValue: mockHashService },
                ],
            }).compile();

            const authServiceWithUndefined = module.get<AuthService>(AuthService);
            expect(authServiceWithUndefined).toBeDefined();
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { HashService } from 'src/common/services/hash.service';

// Mock bcrypt
jest.mock('bcrypt');

describe('HashService', () => {
    let hashService: HashService;
    let loggerErrorSpy: jest.SpyInstance;

    const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

    beforeEach(async () => {
        loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        const module: TestingModule = await Test.createTestingModule({
            providers: [HashService],
        }).compile();
        hashService = module.get<HashService>(HashService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createHash', () => {
        const password = 'testPassword123';
        const hashedPassword = '$2b$12$hashedPasswordHash';

        it('should create hash successfully', () => {
            (mockBcrypt.hashSync as jest.Mock).mockReturnValue(hashedPassword);

            const result = hashService.createHash(password);

            expect(result).toBe(hashedPassword);
            expect(mockBcrypt.hashSync).toHaveBeenCalledWith(password, 12);
        });

        it('should throw error when hash creation fails', () => {
            const mockError = new Error('Hash creation failed');
            (mockBcrypt.hashSync as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            expect(() => hashService.createHash(password)).toThrow('Hash creation failed');
            expect(loggerErrorSpy).toHaveBeenCalled();
        });
    });

    describe('match', () => {
        const password = 'testPassword123';
        const hashedPassword = '$2b$12$hashedPasswordHash';

        it('should return true when password matches hash', () => {
            (mockBcrypt.compareSync as jest.Mock).mockReturnValue(true);

            const result = hashService.match(hashedPassword, password);

            expect(result).toBe(true);
            expect(mockBcrypt.compareSync).toHaveBeenCalledWith(password, hashedPassword);
        });

        it('should return false when password does not match hash', () => {
            (mockBcrypt.compareSync as jest.Mock).mockReturnValue(false);

            const result = hashService.match(hashedPassword, password);

            expect(result).toBe(false);
            expect(mockBcrypt.compareSync).toHaveBeenCalledWith(password, hashedPassword);
        });

        it('should return false and log error when comparison fails', () => {
            const mockError = new Error('Comparison failed');
            (mockBcrypt.compareSync as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            const result = hashService.match(hashedPassword, password);

            expect(result).toBe(false);
            expect(loggerErrorSpy).toHaveBeenCalled();
        });

        it('should handle empty password', () => {
            (mockBcrypt.compareSync as jest.Mock).mockReturnValue(false);

            const result = hashService.match(hashedPassword, '');

            expect(result).toBe(false);
            expect(mockBcrypt.compareSync).toHaveBeenCalledWith('', hashedPassword);
        });

        it('should handle empty hash', () => {
            (mockBcrypt.compareSync as jest.Mock).mockReturnValue(false);

            const result = hashService.match('', password);

            expect(result).toBe(false);
            expect(mockBcrypt.compareSync).toHaveBeenCalledWith(password, '');
        });
    });

    describe('createHashAsync', () => {
        const password = 'testPassword123';
        const hashedPassword = '$2b$12$hashedPasswordHash';

        it('should create hash asynchronously successfully', async () => {
            (mockBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

            const result = await hashService.createHashAsync(password);

            expect(result).toBe(hashedPassword);
            expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
        });

        it('should throw error when async hash creation fails', async () => {
            const mockError = new Error('Async hash creation failed');
            (mockBcrypt.hash as jest.Mock).mockRejectedValue(mockError);

            await expect(hashService.createHashAsync(password)).rejects.toThrow(
                'Hash creation failed',
            );
            expect(loggerErrorSpy).toHaveBeenCalled();
        });
    });

    describe('matchAsync', () => {
        const password = 'testPassword123';
        const hashedPassword = '$2b$12$hashedPasswordHash';

        it('should return true when password matches hash asynchronously', async () => {
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await hashService.matchAsync(hashedPassword, password);

            expect(result).toBe(true);
            expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        });

        it('should return false when password does not match hash asynchronously', async () => {
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await hashService.matchAsync(hashedPassword, password);

            expect(result).toBe(false);
            expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        });

        it('should return false and log error when async comparison fails', async () => {
            const mockError = new Error('Async comparison failed');
            (mockBcrypt.compare as jest.Mock).mockRejectedValue(mockError);

            const result = await hashService.matchAsync(hashedPassword, password);

            expect(result).toBe(false);
            expect(loggerErrorSpy).toHaveBeenCalled();
        });

        it('should handle empty password asynchronously', async () => {
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await hashService.matchAsync(hashedPassword, '');

            expect(result).toBe(false);
            expect(mockBcrypt.compare).toHaveBeenCalledWith('', hashedPassword);
        });

        it('should handle empty hash asynchronously', async () => {
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await hashService.matchAsync('', password);

            expect(result).toBe(false);
            expect(mockBcrypt.compare).toHaveBeenCalledWith(password, '');
        });
    });

    describe('salt rounds', () => {
        it('should use 12 salt rounds for all hash operations', () => {
            const password = 'testPassword123';
            const hashedPassword = '$2b$12$hashedPasswordHash';

            (mockBcrypt.hashSync as jest.Mock).mockReturnValue(hashedPassword);
            (mockBcrypt.compareSync as jest.Mock).mockReturnValue(true);

            hashService.createHash(password);
            hashService.match(hashedPassword, password);

            expect(mockBcrypt.hashSync).toHaveBeenCalledWith(password, 12);
            expect(mockBcrypt.compareSync).toHaveBeenCalledWith(password, hashedPassword);
        });

        it('should use 12 salt rounds for async hash operations', async () => {
            const password = 'testPassword123';
            const hashedPassword = '$2b$12$hashedPasswordHash';

            (mockBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
            (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

            await hashService.createHashAsync(password);
            await hashService.matchAsync(hashedPassword, password);

            expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
            expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        });
    });
});

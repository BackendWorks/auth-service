import { DatabaseService } from 'src/common/services/database.service';
import { createAuthDbManager } from '@backendworks/auth-db';

jest.mock('@backendworks/auth-db', () => ({
    createAuthDbManager: jest.fn(),
}));

describe('DatabaseService', () => {
    let databaseService: DatabaseService;
    let mockUserRepository: any;
    let mockDbManager: any;

    beforeEach(() => {
        mockUserRepository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findOne: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            count: jest.fn(),
        };
        mockDbManager = {
            userRepository: mockUserRepository,
            disconnect: jest.fn().mockResolvedValue(undefined),
        };
        (createAuthDbManager as jest.Mock).mockReturnValue(mockDbManager);

        databaseService = new DatabaseService();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('userRepository', () => {
        it('should expose userRepository from dbManager', () => {
            expect(databaseService.userRepository).toBe(mockUserRepository);
        });
    });

    describe('onModuleInit', () => {
        it('should log connection established', async () => {
            const logSpy = jest.spyOn(databaseService['logger'], 'log').mockImplementation();
            await databaseService.onModuleInit();
            expect(logSpy).toHaveBeenCalledWith('Database connection established');
        });

        it('should log error and rethrow when logger.log throws', async () => {
            const mockError = new Error('Logger failed');
            jest.spyOn(databaseService['logger'], 'log').mockImplementation(() => {
                throw mockError;
            });
            const errorSpy = jest.spyOn(databaseService['logger'], 'error').mockImplementation();
            await expect(databaseService.onModuleInit()).rejects.toThrow('Logger failed');
            expect(errorSpy).toHaveBeenCalledWith('Failed to connect to database', mockError);
        });
    });

    describe('onModuleDestroy', () => {
        it('should disconnect from database successfully', async () => {
            const logSpy = jest.spyOn(databaseService['logger'], 'log').mockImplementation();
            await databaseService.onModuleDestroy();
            expect(mockDbManager.disconnect).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith('Database connection closed');
        });

        it('should log error when disconnection fails', async () => {
            const mockError = new Error('Disconnection failed');
            const errorSpy = jest.spyOn(databaseService['logger'], 'error').mockImplementation();
            mockDbManager.disconnect.mockRejectedValue(mockError);
            await databaseService.onModuleDestroy();
            expect(errorSpy).toHaveBeenCalledWith('Error closing database connection', mockError);
        });
    });

    describe('isHealthy', () => {
        it('should return healthy status when count succeeds', async () => {
            mockUserRepository.count.mockResolvedValue(5);
            const result = await databaseService.isHealthy();
            expect(result).toEqual({ database: { status: 'up', connection: 'active' } });
        });

        it('should return unhealthy status when count throws', async () => {
            const mockError = new Error('DB error');
            const errorSpy = jest.spyOn(databaseService['logger'], 'error').mockImplementation();
            mockUserRepository.count.mockRejectedValue(mockError);
            const result = await databaseService.isHealthy();
            expect(result).toEqual({
                database: { status: 'down', connection: 'failed', error: mockError.message },
            });
            expect(errorSpy).toHaveBeenCalledWith('Database health check failed', mockError);
        });
    });
});

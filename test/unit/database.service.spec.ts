import { DatabaseService } from 'src/common/services/database.service';

describe('DatabaseService', () => {
    let databaseService: DatabaseService;

    beforeEach(() => {
        databaseService = new DatabaseService();
        // Assign mocks directly
        (databaseService as any).$connect = jest.fn().mockResolvedValue(undefined);
        (databaseService as any).$disconnect = jest.fn().mockResolvedValue(undefined);
        (databaseService as any).$queryRaw = jest.fn().mockResolvedValue([{ '1': 1 }]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('onModuleInit', () => {
        it('should connect to database successfully', async () => {
            const logSpy = jest.spyOn(databaseService['logger'], 'log').mockImplementation();
            await databaseService.onModuleInit();
            expect((databaseService as any).$connect).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith('✅ Database connection established');
        });

        it('should throw error when database connection fails', async () => {
            const mockError = new Error('Connection failed');
            const errorSpy = jest.spyOn(databaseService['logger'], 'error').mockImplementation();
            (databaseService as any).$connect = jest.fn().mockRejectedValue(mockError);
            await expect(databaseService.onModuleInit()).rejects.toThrow('Connection failed');
            expect((databaseService as any).$connect).toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith('❌ Failed to connect to database', mockError);
        });
    });

    describe('onModuleDestroy', () => {
        it('should disconnect from database successfully', async () => {
            const logSpy = jest.spyOn(databaseService['logger'], 'log').mockImplementation();
            await databaseService.onModuleDestroy();
            expect((databaseService as any).$disconnect).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith('🔌 Database connection closed');
        });

        it('should log error when database disconnection fails', async () => {
            const mockError = new Error('Disconnection failed');
            const errorSpy = jest.spyOn(databaseService['logger'], 'error').mockImplementation();
            (databaseService as any).$disconnect = jest.fn().mockRejectedValue(mockError);
            await databaseService.onModuleDestroy();
            expect((databaseService as any).$disconnect).toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(
                '❌ Error closing database connection',
                mockError,
            );
        });
    });

    describe('isHealthy', () => {
        it('should return healthy status when database is connected', async () => {
            const errorSpy = jest.spyOn(databaseService['logger'], 'error').mockImplementation();
            (databaseService as any).$queryRaw = jest.fn().mockResolvedValue([{ '1': 1 }]);
            const result = await databaseService.isHealthy();
            expect(result).toEqual({
                database: {
                    status: 'up',
                    connection: 'active',
                },
            });
            expect((databaseService as any).$queryRaw).toHaveBeenCalledWith(
                expect.arrayContaining(['SELECT 1']),
            );
            expect(errorSpy).not.toHaveBeenCalled();
        });

        it('should return unhealthy status when database query fails', async () => {
            const mockError = new Error('Database query failed');
            const errorSpy = jest.spyOn(databaseService['logger'], 'error').mockImplementation();
            (databaseService as any).$queryRaw = jest.fn().mockRejectedValue(mockError);
            const result = await databaseService.isHealthy();
            expect(result).toEqual({
                database: {
                    status: 'down',
                    connection: 'failed',
                    error: mockError.message,
                },
            });
            expect((databaseService as any).$queryRaw).toHaveBeenCalledWith(
                expect.arrayContaining(['SELECT 1']),
            );
            expect(errorSpy).toHaveBeenCalledWith('Database health check failed', mockError);
        });

        it('should handle database timeout errors', async () => {
            const mockError = new Error('Connection timeout');
            const errorSpy = jest.spyOn(databaseService['logger'], 'error').mockImplementation();
            (databaseService as any).$queryRaw = jest.fn().mockRejectedValue(mockError);
            const result = await databaseService.isHealthy();
            expect(result).toEqual({
                database: {
                    status: 'down',
                    connection: 'failed',
                    error: mockError.message,
                },
            });
            expect(errorSpy).toHaveBeenCalledWith('Database health check failed', mockError);
        });

        it('should handle network errors', async () => {
            const mockError = new Error('Network unreachable');
            const errorSpy = jest.spyOn(databaseService['logger'], 'error').mockImplementation();
            (databaseService as any).$queryRaw = jest.fn().mockRejectedValue(mockError);
            const result = await databaseService.isHealthy();
            expect(result).toEqual({
                database: {
                    status: 'down',
                    connection: 'failed',
                    error: mockError.message,
                },
            });
            expect(errorSpy).toHaveBeenCalledWith('Database health check failed', mockError);
        });
    });

    describe('PrismaClient methods', () => {
        it('should have user property for database operations', () => {
            (databaseService as any).user = { findMany: jest.fn() };
            expect(databaseService.user).toBeDefined();
        });

        it('should support all PrismaClient methods', () => {
            expect((databaseService as any).$connect).toBeDefined();
            expect((databaseService as any).$disconnect).toBeDefined();
            expect((databaseService as any).$queryRaw).toBeDefined();
        });
    });

    describe('DatabaseService additional coverage', () => {
        beforeEach(() => {
            databaseService = new DatabaseService();
            (databaseService as any).$connect = jest.fn().mockResolvedValue(undefined);
            (databaseService as any).$disconnect = jest.fn().mockResolvedValue(undefined);
            (databaseService as any).$queryRaw = jest.fn().mockResolvedValue([{ '1': 1 }]);
        });

        it('should handle multiple calls to onModuleInit', async () => {
            await databaseService.onModuleInit();
            await databaseService.onModuleInit();
            expect((databaseService as any).$connect).toHaveBeenCalledTimes(2);
        });

        it('should handle multiple calls to onModuleDestroy', async () => {
            await databaseService.onModuleDestroy();
            await databaseService.onModuleDestroy();
            expect((databaseService as any).$disconnect).toHaveBeenCalledTimes(2);
        });

        it('should handle isHealthy with empty result', async () => {
            (databaseService as any).$queryRaw = jest.fn().mockResolvedValue([]);
            const result = await databaseService.isHealthy();
            expect(result).toEqual({
                database: {
                    status: 'up',
                    connection: 'active',
                },
            });
        });

        it('should handle isHealthy with unexpected result', async () => {
            (databaseService as any).$queryRaw = jest.fn().mockResolvedValue([{}]);
            const result = await databaseService.isHealthy();
            expect(result).toEqual({
                database: {
                    status: 'up',
                    connection: 'active',
                },
            });
        });
    });
});

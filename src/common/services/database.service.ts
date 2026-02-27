import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { createAuthDbManager, IAuthDbManager, IUserRepository } from '@backendworks/auth-db';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);
    private readonly dbManager: IAuthDbManager;

    constructor() {
        this.dbManager = createAuthDbManager(process.env.DATABASE_URL as string);
    }

    get userRepository(): IUserRepository {
        return this.dbManager.userRepository;
    }

    async onModuleInit(): Promise<void> {
        try {
            this.logger.log('Database connection established');
        } catch (error) {
            this.logger.error('Failed to connect to database', error);
            throw error;
        }
    }

    async onModuleDestroy(): Promise<void> {
        try {
            await this.dbManager.disconnect();
            this.logger.log('Database connection closed');
        } catch (error) {
            this.logger.error('Error closing database connection', error);
        }
    }

    async isHealthy(): Promise<HealthIndicatorResult> {
        try {
            await this.dbManager.userRepository.count();
            return {
                database: {
                    status: 'up',
                    connection: 'active',
                },
            };
        } catch (error) {
            this.logger.error('Database health check failed', error);
            return {
                database: {
                    status: 'down',
                    connection: 'failed',
                    error: error.message,
                },
            };
        }
    }
}

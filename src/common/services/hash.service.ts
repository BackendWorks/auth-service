import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
    private readonly logger = new Logger(HashService.name);
    private readonly saltRounds = 12;

    createHash(password: string): string {
        try {
            return bcrypt.hashSync(password, this.saltRounds);
        } catch (error) {
            this.logger.error('Failed to create hash', error);
            throw new Error('Hash creation failed');
        }
    }

    match(hash: string, password: string): boolean {
        try {
            return bcrypt.compareSync(password, hash);
        } catch (error) {
            this.logger.error('Failed to compare hash', error);
            return false;
        }
    }

    async createHashAsync(password: string): Promise<string> {
        try {
            return await bcrypt.hash(password, this.saltRounds);
        } catch (error) {
            this.logger.error('Failed to create hash async', error);
            throw new Error('Hash creation failed');
        }
    }

    async matchAsync(hash: string, password: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            this.logger.error('Failed to compare hash async', error);
            return false;
        }
    }
}

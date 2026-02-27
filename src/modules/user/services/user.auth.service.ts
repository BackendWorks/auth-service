import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/services/database.service';
import { UserResponseDto } from '../dtos/user.response.dto';
import { UserUpdateDto } from '../dtos/user.update.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UserAuthService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getUserProfile(userId: string): Promise<UserResponseDto | null> {
        const user = await this.databaseService.user.findUnique({
            where: { id: userId, deletedAt: null },
        });
        return user ?? null;
    }

    async getUserProfileByEmail(email: string): Promise<UserResponseDto | null> {
        const user = await this.databaseService.user.findUnique({
            where: { email, deletedAt: null },
        });
        return user ?? null;
    }

    async updateUserProfile(userId: string, updateDto: UserUpdateDto): Promise<UserResponseDto> {
        const user = await this.getUserProfile(userId);

        return this.databaseService.user.update({
            where: { id: user.id },
            data: {
                firstName: updateDto.firstName?.trim(),
                lastName: updateDto.lastName?.trim(),
                email: updateDto.email,
                phoneNumber: updateDto.phoneNumber,
                avatar: updateDto.avatar,
            },
        });
    }

    async createUser(data: Partial<UserResponseDto>): Promise<UserResponseDto> {
        return this.databaseService.user.create({
            data: {
                email: data.email,
                firstName: data.firstName?.trim() || '',
                lastName: data.lastName?.trim() || '',
                phoneNumber: data.phoneNumber,
                avatar: data.avatar,
                password: data.password,
                role: Role.USER, // Assuming a default role
            },
        });
    }
}

import { Injectable } from '@nestjs/common';
import { Role } from '@backendworks/auth-db';
import { DatabaseService } from 'src/common/services/database.service';
import { UserResponseDto } from '../dtos/user.response.dto';
import { UserUpdateDto } from '../dtos/user.update.dto';

@Injectable()
export class UserAuthService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getUserProfile(userId: string): Promise<UserResponseDto | null> {
        return this.databaseService.userRepository.findById(userId);
    }

    async getUserProfileByEmail(email: string): Promise<UserResponseDto | null> {
        return this.databaseService.userRepository.findByEmail(email);
    }

    async updateUserProfile(userId: string, updateDto: UserUpdateDto): Promise<UserResponseDto> {
        return this.databaseService.userRepository.update(userId, {
            firstName: updateDto.firstName?.trim(),
            lastName: updateDto.lastName?.trim(),
            email: updateDto.email,
            phoneNumber: updateDto.phoneNumber,
            avatar: updateDto.avatar,
        }) as Promise<UserResponseDto>;
    }

    async createUser(data: Partial<UserResponseDto>): Promise<UserResponseDto> {
        return this.databaseService.userRepository.create({
            email: data.email,
            firstName: data.firstName?.trim() || '',
            lastName: data.lastName?.trim() || '',
            phoneNumber: data.phoneNumber,
            avatar: data.avatar,
            password: data.password,
            role: Role.USER,
        }) as Promise<UserResponseDto>;
    }
}

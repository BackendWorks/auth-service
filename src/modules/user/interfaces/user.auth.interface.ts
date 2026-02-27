import { UserResponseDto } from '../dtos/user.response.dto';
import { UserUpdateDto } from '../dtos/user.update.dto';

export interface IUserAuthService {
    getUserProfile(userId: string): Promise<UserResponseDto>;
    updateUserProfile(userId: string, updateDto: UserUpdateDto): Promise<UserResponseDto>;
}

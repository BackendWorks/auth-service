import { Injectable, NotFoundException } from '@nestjs/common';

import { UserListDto } from '../dtos/user-list.dto';
import { DatabaseService } from 'src/common/services/database.service';
import { UserResponseDto } from '../dtos/user.response.dto';
import { QueryBuilderService } from 'src/common/services/query-builder.service';

@Injectable()
export class UserAdminService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly queryBuilder: QueryBuilderService,
    ) {}

    async listUsers(listDto: UserListDto) {
        return this.queryBuilder.findManyWithPagination<UserResponseDto>({
            model: 'user',
            dto: listDto,
            defaultSort: { field: 'createdAt', order: 'desc' },
            searchFields: ['firstName', 'lastName', 'email'],
        });
    }

    async deleteUser(userId: string): Promise<void> {
        const user = await this.databaseService.user.findUnique({
            where: { id: userId, deletedAt: null },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.databaseService.user.update({
            where: { id: userId },
            data: { deletedAt: new Date() },
        });
    }
}

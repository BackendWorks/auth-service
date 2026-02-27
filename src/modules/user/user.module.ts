import { Module } from '@nestjs/common';

import { CommonModule } from 'src/common/common.module';
import { UserAdminController } from './controllers/user.admin.controller';
import { UserAuthController } from './controllers/user.auth.controller';
import { UserAuthService } from './services/user.auth.service';
import { UserAdminService } from './services/user.admin.service';

@Module({
    imports: [CommonModule],
    controllers: [UserAdminController, UserAuthController],
    providers: [UserAuthService, UserAdminService],
    exports: [UserAuthService, UserAdminService],
})
export class UserModule {}

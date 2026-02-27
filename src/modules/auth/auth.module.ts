import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CommonModule } from 'src/common/common.module';
import { AuthPublicController } from './controllers/auth.public.controller';
import { AuthService } from './services/auth.service';
import { UserModule } from '../user/user.module';

export const AUTH_WORKER_CLIENT = 'AUTH_WORKER_CLIENT';

@Module({
    imports: [
        JwtModule.register({}),
        PassportModule.register({ session: false }),
        CommonModule,
        UserModule,
        ClientsModule.registerAsync([
            {
                name: AUTH_WORKER_CLIENT,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.getOrThrow<string>('rabbitmq.url')],
                        queue: configService.getOrThrow<string>('rabbitmq.authWorkerQueue'),
                        queueOptions: { durable: true },
                    },
                }),
            },
        ]),
    ],
    controllers: [AuthPublicController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}

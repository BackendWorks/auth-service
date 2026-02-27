import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';

import { CommonModule } from 'src/common/common.module';
import { RABBITMQ_CLIENT } from './constants/auth.constants';
import { AuthPublicController } from './controllers/auth.public.controller';
import { AuthService } from './services/auth.service';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        JwtModule.register({}),
        PassportModule.register({ session: false }),
        CommonModule,
        UserModule,
        ClientsModule.registerAsync([
            {
                name: RABBITMQ_CLIENT,
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            configService.get<string>('rabbitmq.url') ??
                                'amqp://guest:guest@localhost:5672',
                        ],
                        queue: configService.get<string>('rabbitmq.queue') ?? 'auth_worker_queue',
                        queueOptions: { durable: true },
                        noAck: false,
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

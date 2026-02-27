import { registerAs } from '@nestjs/config';

export interface IRabbitmqConfig {
    url: string;
    authWorkerQueue: string;
}

export default registerAs(
    'rabbitmq',
    (): IRabbitmqConfig => ({
        url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
        authWorkerQueue: process.env.RABBITMQ_AUTH_WORKER_QUEUE || 'auth_worker_queue',
    }),
);

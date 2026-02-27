import { registerAs } from '@nestjs/config';

export interface IRabbitmqConfig {
    url: string;
    queue: string;
}

export default registerAs(
    'rabbitmq',
    (): IRabbitmqConfig => ({
        url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
        queue: process.env.RABBITMQ_QUEUE ?? 'auth_worker_queue',
    }),
);

import { registerAs } from '@nestjs/config';
import { IGrpcConfig } from '../interfaces/config.interface';

export default registerAs('grpc', (): IGrpcConfig => {
    const grpcUrl = process.env.GRPC_URL;
    const grpcPackage = process.env.GRPC_PACKAGE;

    return {
        url: grpcUrl,
        package: grpcPackage,
    };
});

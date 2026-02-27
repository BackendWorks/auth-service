import { applyDecorators, SetMetadata } from '@nestjs/common';
import { MESSAGE_KEY_METADATA, MESSAGE_DTO_METADATA } from '../constants/response.constant';

export const MessageKey = (key: string, dto?: new () => any) =>
    applyDecorators(SetMetadata(MESSAGE_KEY_METADATA, key), SetMetadata(MESSAGE_DTO_METADATA, dto));

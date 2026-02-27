import type { IAuthPayload, ITokenResponse } from './auth.interface';
import type { AuthLoginDto } from 'src/modules/auth/dtos/auth.login.dto';
import type { AuthResponseDto } from 'src/modules/auth/dtos/auth.response.dto';
import type { AuthSignupDto } from 'src/modules/auth/dtos/auth.signup.dto';

export interface IAuthService {
    verifyToken(accessToken: string): Promise<IAuthPayload>;
    generateTokens(user: IAuthPayload): Promise<ITokenResponse>;
    login(data: AuthLoginDto): Promise<AuthResponseDto>;
    signup(data: AuthSignupDto): Promise<AuthResponseDto>;
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { HashService } from 'src/common/services/hash.service';

import { AuthLoginDto } from '../dtos/auth.login.dto';
import { AuthResponseDto } from '../dtos/auth.response.dto';
import { AuthSignupDto } from '../dtos/auth.signup.dto';
import { IAuthPayload, ITokenResponse, TokenType } from '../interfaces/auth.interface';
import { UserAuthService } from 'src/modules/user/services/user.auth.service';

@Injectable()
export class AuthService {
    private readonly accessTokenSecret: string;
    private readonly refreshTokenSecret: string;
    private readonly accessTokenExp: string;
    private readonly refreshTokenExp: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly hashService: HashService,
        private readonly userAuthService: UserAuthService,
    ) {
        this.accessTokenSecret = this.configService.get<string>('auth.accessToken.secret') ?? '';
        this.refreshTokenSecret = this.configService.get<string>('auth.refreshToken.secret') ?? '';
        this.accessTokenExp =
            this.configService.get<string>('auth.accessToken.expirationTime') ?? '';
        this.refreshTokenExp =
            this.configService.get<string>('auth.refreshToken.expirationTime') ?? '';
    }

    async verifyToken(accessToken: string): Promise<IAuthPayload> {
        return await this.jwtService.verifyAsync<IAuthPayload>(accessToken, {
            secret: this.accessTokenSecret,
        });
    }

    async generateTokens(user: IAuthPayload): Promise<ITokenResponse> {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                { id: user.id, role: user.role, tokenType: TokenType.ACCESS_TOKEN },
                { secret: this.accessTokenSecret, expiresIn: this.accessTokenExp },
            ),
            this.jwtService.signAsync(
                { id: user.id, role: user.role, tokenType: TokenType.REFRESH_TOKEN },
                { secret: this.refreshTokenSecret, expiresIn: this.refreshTokenExp },
            ),
        ]);

        return { accessToken, refreshToken };
    }

    async login(data: AuthLoginDto): Promise<AuthResponseDto> {
        const { email, password } = data;
        const user = await this.userAuthService.getUserProfileByEmail(email);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = this.hashService.match(user.password, password);
        if (!isPasswordValid) {
            throw new NotFoundException('Invalid password');
        }

        const tokens = await this.generateTokens({ id: user.id, role: user.role });

        return { ...tokens, user };
    }

    async signup(data: AuthSignupDto): Promise<AuthResponseDto> {
        const { email, firstName, lastName, password } = data;
        const existingUser = await this.userAuthService.getUserProfileByEmail(email);

        if (existingUser) {
            throw new ConflictException('User already exists with this email');
        }

        const hashedPassword = this.hashService.createHash(password);
        const createdUser = await this.userAuthService.createUser({
            email,
            firstName: firstName ?? '',
            lastName: lastName ?? '',
            password: hashedPassword,
        });

        if (!createdUser?.id || !createdUser?.role) {
            throw new Error('Failed to create user');
        }

        const tokens = await this.generateTokens({
            id: createdUser.id,
            role: createdUser.role,
        });

        return { ...tokens, user: createdUser };
    }
}

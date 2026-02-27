# auth-service

[![CI](https://github.com/BackendWorks/auth-service/actions/workflows/ci.yml/badge.svg)](https://github.com/BackendWorks/auth-service/actions/workflows/ci.yml)
[![Tests](https://github.com/BackendWorks/auth-service/actions/workflows/test.yml/badge.svg)](https://github.com/BackendWorks/auth-service/actions/workflows/test.yml)

NestJS authentication microservice. Handles user registration, login, token refresh, and user management. Exposes a gRPC `ValidateToken` RPC consumed by `post-service` on every protected request.

## Responsibilities

- JWT access + refresh token issuance and rotation
- User signup, login, and profile management
- Role-based access control (`USER`, `ADMIN`)
- gRPC server exposing `ValidateToken` for inter-service auth
- Soft-delete user management (admin)

## Ports

| Protocol | Address |
|---|---|
| HTTP | `:9001` |
| gRPC | `:50051` |

## Tech Stack

NestJS 11 · TypeScript · PostgreSQL · Prisma (via `@backendworks/auth-db`) · Redis · Passport.js (JWT strategy) · gRPC (`nestjs-grpc`) · Swagger · nestjs-i18n · Jest

## Getting Started

```bash
npm install
npm run dev       # proto:generate → nest start --watch
```

> After editing any `.proto` file run `npm run proto:generate` manually, or just restart `npm run dev`.

## Environment Variables

```env
NODE_ENV=local
APP_NAME=@backendworks/auth
APP_PORT=9001
APP_CORS_ORIGINS=*
APP_DEBUG=true

DATABASE_URL=postgresql://admin:master123@localhost:5432/postgres?schema=public

ACCESS_TOKEN_SECRET_KEY=your-access-secret
ACCESS_TOKEN_EXPIRED=1d
REFRESH_TOKEN_SECRET_KEY=your-refresh-secret
REFRESH_TOKEN_EXPIRED=7d

REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=auth:
REDIS_TTL=3600

GRPC_URL=0.0.0.0:50051
GRPC_PACKAGE=auth
```

## API Endpoints

### Public

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login — returns `accessToken` + `refreshToken` |
| `POST` | `/auth/signup` | Register new user |
| `GET` | `/auth/refresh` | Refresh token rotation |
| `GET` | `/health` | Health check |

### Protected (Bearer token)

| Method | Path | Description |
|---|---|---|
| `GET` | `/user/me` | Authenticated user profile |

### Admin only

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/user` | List users (paginated, filterable by role) |
| `PATCH` | `/admin/user/:id` | Update user |
| `DELETE` | `/admin/user/:id` | Soft-delete user |

Swagger docs available at `http://localhost:9001/docs`.

## gRPC

Proto file: `src/protos/auth.proto`
Generated types: `src/generated/auth.ts` — **do not edit manually**

```protobuf
service AuthService {
  rpc ValidateToken (ValidateTokenRequest) returns (ValidateTokenResponse);
}
```

Called by `post-service` on every protected HTTP request to verify Bearer tokens.

## Project Structure

```
src/
├── app/
│   ├── app.module.ts             # Root module
│   ├── app.controller.ts         # Health check
│   └── auth.grpc.controller.ts   # gRPC ValidateToken endpoint
├── common/
│   ├── config/                   # Typed registerAs() config factories
│   ├── decorators/               # @PublicRoute, @AdminOnly, @AuthUser, @MessageKey
│   ├── guards/                   # JwtAccessGuard, JwtRefreshGuard, RolesGuard
│   ├── providers/                # Passport JWT strategies
│   ├── services/                 # HashService, QueryBuilderService
│   └── interceptors/             # ResponseInterceptor
├── modules/
│   ├── auth/                     # Login, signup, refresh
│   └── user/                     # Profile + admin CRUD
├── protos/                       # auth.proto
└── generated/                    # Auto-generated gRPC types
```

## Scripts

```bash
npm run dev              # Watch mode (proto:generate first)
npm run build            # Production build
npm run proto:generate   # Regenerate gRPC types from .proto
npm run lint             # ESLint --fix
npm run format           # Prettier --write
npm test                 # Unit tests (100% coverage enforced)
npm run test:cov         # Tests with coverage report
```

## Testing

Tests live in `test/unit/`. Coverage thresholds are enforced at **100%** for branches, functions, lines, and statements.

```bash
npm test
```

## Response Shape

All HTTP responses are wrapped by `ResponseInterceptor`:

```json
{
  "statusCode": 200,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "message": "auth.success.login",
  "data": { ... }
}
```

## License

[MIT](LICENSE)

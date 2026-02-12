import bcrypt from 'bcryptjs';

const passwordHash = bcrypt.hashSync('MagnusPass!123', 10);

process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '4100';
process.env.CORS_ORIGIN ??= 'http://127.0.0.1:4173';
process.env.DATABASE_URL ??= 'postgresql://user:pass@127.0.0.1:5432/magnus_test';
process.env.JWT_SECRET ??= 'test-jwt-secret-string-with-sufficient-length';
process.env.SESSION_COOKIE_NAME ??= 'magnus_session';
process.env.SESSION_TTL_SECONDS ??= '900';
process.env.AUTH_COOKIE_SECURE ??= 'false';
process.env.AUTH_SUPPLIER_USERNAME ??= 'supplier';
process.env.AUTH_SUPPLIER_PASSWORD_HASH ??= passwordHash;
process.env.AUTH_BUYER_USERNAME ??= 'buyer';
process.env.AUTH_BUYER_PASSWORD_HASH ??= passwordHash;
process.env.AUTH_ADMIN_USERNAME ??= 'admin';
process.env.AUTH_ADMIN_PASSWORD_HASH ??= passwordHash;
process.env.GEMINI_API_KEY ??= 'gemini-key-1234567890';
process.env.LOG_LEVEL ??= 'fatal';

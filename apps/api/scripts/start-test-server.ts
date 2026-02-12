import bcrypt from 'bcryptjs';

const setDefault = (key: string, value: string): void => {
  if (process.env[key] == null || process.env[key] === '') {
    process.env[key] = value;
  }
};

setDefault('NODE_ENV', 'test');
setDefault('PORT', '4001');
setDefault('CORS_ORIGIN', 'http://127.0.0.1:3000');
setDefault('DATABASE_URL', 'postgresql://user:pass@127.0.0.1:5432/magnus_test');
setDefault('JWT_SECRET', 'test-jwt-secret-string-with-sufficient-length');
setDefault('SESSION_COOKIE_NAME', 'magnus_session');
setDefault('SESSION_TTL_SECONDS', '900');
setDefault('AUTH_COOKIE_SECURE', 'false');
setDefault('AUTH_SUPPLIER_USERNAME', 'supplier');
setDefault('AUTH_SUPPLIER_PASSWORD_HASH', bcrypt.hashSync('SupplierPass!123', 10));
setDefault('AUTH_BUYER_USERNAME', 'buyer');
setDefault('AUTH_BUYER_PASSWORD_HASH', bcrypt.hashSync('BuyerPass!123', 10));
setDefault('AUTH_ADMIN_USERNAME', 'admin');
setDefault('AUTH_ADMIN_PASSWORD_HASH', bcrypt.hashSync('AdminPass!123', 10));
setDefault('GEMINI_API_KEY', 'disabled-in-tests-key');
setDefault('LOG_LEVEL', 'error');

const [{ createApp }, { env }, { logger }] = await Promise.all([
  import('../src/app.ts'),
  import('../src/config/env.ts'),
  import('../src/lib/logger.ts')
]);

const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'test-server-listening');
});

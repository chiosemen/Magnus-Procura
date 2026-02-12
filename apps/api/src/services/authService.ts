import bcrypt from 'bcryptjs';

import { BadRequestError, UnauthorizedError } from '../lib/errors.js';
import type { AuthUser } from '../types/auth.js';
import { env } from '../config/env.js';

interface CredentialRecord {
  username: string;
  role: AuthUser['role'];
  passwordHash: string;
}

const credentialStore: readonly CredentialRecord[] = [
  {
    username: env.AUTH_SUPPLIER_USERNAME,
    role: 'SUPPLIER',
    passwordHash: env.AUTH_SUPPLIER_PASSWORD_HASH
  },
  {
    username: env.AUTH_BUYER_USERNAME,
    role: 'BUYER',
    passwordHash: env.AUTH_BUYER_PASSWORD_HASH
  },
  {
    username: env.AUTH_ADMIN_USERNAME,
    role: 'ADMIN',
    passwordHash: env.AUTH_ADMIN_PASSWORD_HASH
  }
];

export const authenticate = async (username: string, password: string): Promise<AuthUser> => {
  if (username.length === 0 || password.length === 0) {
    throw new BadRequestError('Username and password are required');
  }

  const record = credentialStore.find((item) => item.username === username);
  if (record == null) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const matches = await bcrypt.compare(password, record.passwordHash);
  if (!matches) {
    throw new UnauthorizedError('Invalid credentials');
  }

  return {
    username: record.username,
    role: record.role
  };
};

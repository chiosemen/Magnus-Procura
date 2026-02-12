import type { AuthUser } from '@shared-types/index';

import { requestJson } from './api';

export const authService = {
  getSession: async (): Promise<AuthUser> => {
    const response = await requestJson<{ user: AuthUser }>('/api/auth/me', {
      method: 'GET'
    });

    return response.user;
  },

  login: async (username: string, password: string): Promise<AuthUser> => {
    const response = await requestJson<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    return response.user;
  },

  logout: async (): Promise<void> => {
    await requestJson('/api/auth/logout', {
      method: 'POST'
    });
  }
};

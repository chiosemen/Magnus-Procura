export const ROLES = ['SUPPLIER', 'BUYER', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export interface AuthUser {
  username: string;
  role: Role;
}

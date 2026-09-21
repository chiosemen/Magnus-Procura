export type Role = 'SUPPLIER' | 'BUYER' | 'ADMIN';

export type Capability =
  | 'scoring:trigger'
  | 'vault:read'
  | 'vault:write'
  | 'syndication:publish'
  | 'supplier:manage'
  | 'buyer:manage';

const roleCapabilities: Record<Role, ReadonlySet<Capability>> = {
  SUPPLIER: new Set<Capability>(['vault:read']),
  BUYER: new Set<Capability>(['vault:read']),
  ADMIN: new Set<Capability>([
    'scoring:trigger',
    'vault:read',
    'vault:write',
    'syndication:publish',
    'supplier:manage',
    'buyer:manage'
  ])
};

export class RbacError extends Error {
  public readonly code = 'RBAC_FORBIDDEN' as const;
}

export const hasCapability = (role: Role, capability: Capability): boolean => {
  return roleCapabilities[role].has(capability);
};

export const assertCapability = (role: Role, capability: Capability): void => {
  if (!hasCapability(role, capability)) {
    throw new RbacError(`Role ${role} is not allowed to perform ${capability}`);
  }
};


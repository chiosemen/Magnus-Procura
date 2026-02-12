import { PolicyViolationError, type AgentContext } from 'agent-core';

import { db } from '../lib/db.js';

const deny = (message: string): never => {
  throw new PolicyViolationError(message);
};

export const assertSupplierReadAccess = async (ctx: AgentContext, supplierId: string): Promise<void> => {
  if (ctx.actor.role === 'ADMIN') {
    return;
  }

  if (ctx.actor.role === 'SUPPLIER') {
    const owner = await db.query<{ supplier_id: string }>(
      `SELECT supplier_id
         FROM supplier_accounts
        WHERE supplier_username = $1
        LIMIT 1`,
      [ctx.actor.username]
    );

    const ownedId = owner.rows[0]?.supplier_id;
    if (!ownedId) {
      deny('Supplier account mapping is missing');
    }

    if (ownedId !== supplierId) {
      deny('Suppliers can only access their own records');
    }

    return;
  }

  if (ctx.actor.role === 'BUYER') {
    const access = await db.query<{ supplier_id: string }>(
      `SELECT supplier_id
         FROM buyer_supplier_access
        WHERE buyer_username = $1 AND supplier_id = $2
        LIMIT 1`,
      [ctx.actor.username, supplierId]
    );

    if (!access.rows[0]) {
      deny('Buyer does not have access to this supplier record');
    }
    return;
  }

  deny('Not authorized');
};

export const assertSupplierWriteAccess = async (ctx: AgentContext, supplierId: string): Promise<void> => {
  if (ctx.actor.role === 'ADMIN') {
    return;
  }

  if (ctx.actor.role !== 'SUPPLIER') {
    deny('Only suppliers (own record) or admins may perform this action');
  }

  const owner = await db.query<{ supplier_id: string }>(
    `SELECT supplier_id
       FROM supplier_accounts
      WHERE supplier_username = $1
      LIMIT 1`,
    [ctx.actor.username]
  );

  const ownedId = owner.rows[0]?.supplier_id;
  if (!ownedId) {
    deny('Supplier account mapping is missing');
  }

  if (ownedId !== supplierId) {
    deny('Suppliers can only modify their own records');
  }
};


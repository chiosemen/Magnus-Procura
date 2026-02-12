import { ToolRegistry } from 'agent-core';
import { scoringReadExplainabilityTool, scoringTriggerTool } from 'agent-tool-scoring';
import { vaultUploadChecklistTool } from 'agent-tool-vault';

import { db } from '../lib/db.js';
import { assertSupplierReadAccess, assertSupplierWriteAccess } from './access.js';

export const buildAgentToolRegistry = (): ToolRegistry => {
  const registry = new ToolRegistry();

  registry.register(
    scoringReadExplainabilityTool({
      db,
      access: {
        assertReadAccess: assertSupplierReadAccess,
        assertWriteAccess: assertSupplierWriteAccess
      }
    })
  );

  registry.register(
    scoringTriggerTool({
      db,
      access: {
        assertReadAccess: assertSupplierReadAccess,
        assertWriteAccess: assertSupplierWriteAccess
      }
    })
  );

  registry.register(
    vaultUploadChecklistTool({
      db,
      access: { assertReadAccess: assertSupplierReadAccess }
    })
  );

  return registry;
};


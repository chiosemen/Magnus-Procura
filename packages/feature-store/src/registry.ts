import type { FeatureDefinition } from './types.js';
import { FeatureSchemaAlreadyRegisteredError, FeatureSchemaNotRegisteredError } from './types.js';
import { validateFeatureDefinition } from './validators.js';

export class FeatureSchemaRegistry {
  private readonly schemas = new Map<string, Map<number, FeatureDefinition>>();

  public register(definition: FeatureDefinition): void {
    validateFeatureDefinition(definition);

    const byVersion = this.schemas.get(definition.name) ?? new Map<number, FeatureDefinition>();
    const existing = byVersion.get(definition.version);
    if (existing) {
      if (existing.description !== definition.description || existing.schema !== definition.schema) {
        throw new FeatureSchemaAlreadyRegisteredError(definition.name, definition.version);
      }
      return;
    }

    byVersion.set(definition.version, definition);
    this.schemas.set(definition.name, byVersion);
  }

  public get(featureName: string, version: number): FeatureDefinition {
    const byVersion = this.schemas.get(featureName);
    const def = byVersion?.get(version);
    if (!def) {
      throw new FeatureSchemaNotRegisteredError(featureName, version);
    }
    return def;
  }
}

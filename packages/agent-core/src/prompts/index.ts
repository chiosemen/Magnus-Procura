export interface PromptTemplate {
  readonly promptId: string;
  readonly promptVersion: string;
  readonly system: string;
  readonly user: (args: Record<string, string>) => string;
}

export class PromptRegistry {
  private readonly prompts = new Map<string, PromptTemplate>();

  private key(promptId: string, promptVersion: string): string {
    return `${promptId}@${promptVersion}`;
  }

  public register(template: PromptTemplate): void {
    const key = this.key(template.promptId, template.promptVersion);
    if (this.prompts.has(key)) {
      throw new Error(`Prompt already registered: ${key}`);
    }
    this.prompts.set(key, template);
  }

  public require(promptId: string, promptVersion: string): PromptTemplate {
    const key = this.key(promptId, promptVersion);
    const prompt = this.prompts.get(key);
    if (!prompt) {
      throw new Error(`Prompt not found: ${key}`);
    }
    return prompt;
  }
}


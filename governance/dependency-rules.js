const toolPackages = ['supplier', 'buyer', 'scoring', 'vault', 'syndication'];
const providerPackages = ['openai', 'gemini', 'anthropic'];

const toolNoCrossImports = toolPackages.flatMap((tool) => {
  const otherTools = toolPackages.filter((candidate) => candidate !== tool);
  return otherTools.map((other) => {
    return {
      name: `no-agent-tool-${tool}-to-${other}`,
      comment: `packages/agent-tools/${tool} must not import packages/agent-tools/${other}.`,
      severity: 'error',
      from: { path: `^packages/agent-tools/${tool}/` },
      to: { path: `^packages/agent-tools/${other}/` }
    };
  });
});

const providerNoCrossImports = providerPackages.flatMap((provider) => {
  const otherProviders = providerPackages.filter((candidate) => candidate !== provider);
  return otherProviders.map((other) => {
    return {
      name: `no-agent-provider-${provider}-to-${other}`,
      comment: `packages/agent-providers/${provider} must not import packages/agent-providers/${other}.`,
      severity: 'error',
      from: { path: `^packages/agent-providers/${provider}/` },
      to: { path: `^packages/agent-providers/${other}/` }
    };
  });
});

export default {
  forbidden: [
    {
      name: 'only-api-can-import-network-syndication',
      comment: 'Only apps/api may import packages/network-syndication (outbound event emission is API-only).',
      severity: 'error',
      from: { path: '^((apps/(?!api/).+)|(packages/(?!network-syndication/).+))' },
      to: { path: '^packages/network-syndication/' }
    },
    {
      name: 'only-core-can-import-feature-store',
      comment: 'Only packages/scoring-engine and packages/policy-engine may import packages/feature-store.',
      severity: 'error',
      from: { path: '^((apps/)|(packages/(?!scoring-engine/|policy-engine/|feature-store/).+))' },
      to: { path: '^packages/feature-store/' }
    },
    {
      name: 'no-web-to-agent-tools',
      comment: 'apps/web must never import packages/agent-tools directly.',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^packages/agent-tools/' }
    },
    {
      name: 'no-web-to-agent-providers',
      comment: 'apps/web must never import packages/agent-providers directly.',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^packages/agent-providers/' }
    },
    {
      name: 'no-web-to-agent-core-or-policies',
      comment: 'apps/web must not import agent-core or agent-policies directly.',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^packages/(agent-core|agent-policies)/' }
    },
    {
      name: 'only-api-can-import-agent-packages',
      comment: 'Only apps/api is allowed to import agent packages (agent-core, agent-policies, agent-tools, agent-providers).',
      severity: 'error',
      from: {
        path: '^((apps/web/)|(packages/(shared-types|shared-utils)/))'
      },
      to: {
        path: '^packages/(agent-core|agent-policies|agent-tools|agent-providers)/'
      }
    },
    {
      name: 'no-web-to-api-server',
      comment: 'apps/web must not import apps/api server modules directly.',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^apps/api/' }
    },
    {
      name: 'no-packages-to-web',
      comment: 'packages must not import apps/web.',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/web/' }
    },
    {
      name: 'no-packages-to-api',
      comment: 'packages must not import apps/api.',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/api/' }
    },
    {
      name: 'no-providers-to-tools',
      comment: 'Provider packages must not import tool packages (prevents cross-context coupling).',
      severity: 'error',
      from: { path: '^packages/agent-providers/' },
      to: { path: '^packages/agent-tools/' }
    },
    ...toolNoCrossImports,
    ...providerNoCrossImports
  ],
  options: {
    tsConfig: {
      fileName: './tsconfig.json'
    },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json']
    },
    doNotFollow: {
      path: 'node_modules'
    },
    includeOnly: '^((apps|packages)/)',
    exclude: {
      path: '^(dist|coverage|playwright-report|test-results|node_modules)/'
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true
  }
};

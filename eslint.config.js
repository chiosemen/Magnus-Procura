import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'test-results/**']
  },
  js.configs.recommended,
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    plugins: {
      boundaries
    },
    settings: {
      'boundaries/elements': [
        { type: 'app-web', pattern: 'apps/web/**' },
        { type: 'app-api', pattern: 'apps/api/**' },
        { type: 'pkg-agent-core', pattern: 'packages/agent-core/**' },
        { type: 'pkg-agent-policies', pattern: 'packages/agent-policies/**' },
        { type: 'pkg-agent-provider-openai', pattern: 'packages/agent-providers/openai/**' },
        { type: 'pkg-agent-provider-gemini', pattern: 'packages/agent-providers/gemini/**' },
        { type: 'pkg-agent-provider-anthropic', pattern: 'packages/agent-providers/anthropic/**' },
        { type: 'pkg-agent-tool-supplier', pattern: 'packages/agent-tools/supplier/**' },
        { type: 'pkg-agent-tool-buyer', pattern: 'packages/agent-tools/buyer/**' },
        { type: 'pkg-agent-tool-scoring', pattern: 'packages/agent-tools/scoring/**' },
        { type: 'pkg-agent-tool-vault', pattern: 'packages/agent-tools/vault/**' },
        { type: 'pkg-agent-tool-syndication', pattern: 'packages/agent-tools/syndication/**' },
        { type: 'pkg-shared-types', pattern: 'packages/shared-types/**' },
        { type: 'pkg-shared-utils', pattern: 'packages/shared-utils/**' }
      ]
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'app-web',
              allow: ['app-web', 'pkg-shared-types', 'pkg-shared-utils']
            },
            {
              from: 'app-api',
              allow: [
                'app-api',
                'pkg-agent-core',
                'pkg-agent-policies',
                'pkg-agent-provider-openai',
                'pkg-agent-provider-gemini',
                'pkg-agent-provider-anthropic',
                'pkg-agent-tool-supplier',
                'pkg-agent-tool-buyer',
                'pkg-agent-tool-scoring',
                'pkg-agent-tool-vault',
                'pkg-agent-tool-syndication',
                'pkg-shared-types',
                'pkg-shared-utils'
              ]
            },
            {
              from: ['pkg-agent-tool-supplier'],
              allow: [
                'pkg-agent-tool-supplier',
                'pkg-agent-core',
                'pkg-agent-policies',
                'pkg-agent-provider-openai',
                'pkg-agent-provider-gemini',
                'pkg-agent-provider-anthropic',
                'pkg-shared-types',
                'pkg-shared-utils'
              ]
            },
            {
              from: ['pkg-agent-tool-buyer'],
              allow: [
                'pkg-agent-tool-buyer',
                'pkg-agent-core',
                'pkg-agent-policies',
                'pkg-agent-provider-openai',
                'pkg-agent-provider-gemini',
                'pkg-agent-provider-anthropic',
                'pkg-shared-types',
                'pkg-shared-utils'
              ]
            },
            {
              from: ['pkg-agent-tool-scoring'],
              allow: [
                'pkg-agent-tool-scoring',
                'pkg-agent-core',
                'pkg-agent-policies',
                'pkg-agent-provider-openai',
                'pkg-agent-provider-gemini',
                'pkg-agent-provider-anthropic',
                'pkg-shared-types',
                'pkg-shared-utils'
              ]
            },
            {
              from: ['pkg-agent-tool-vault'],
              allow: [
                'pkg-agent-tool-vault',
                'pkg-agent-core',
                'pkg-agent-policies',
                'pkg-agent-provider-openai',
                'pkg-agent-provider-gemini',
                'pkg-agent-provider-anthropic',
                'pkg-shared-types',
                'pkg-shared-utils'
              ]
            },
            {
              from: ['pkg-agent-tool-syndication'],
              allow: [
                'pkg-agent-tool-syndication',
                'pkg-agent-core',
                'pkg-agent-policies',
                'pkg-agent-provider-openai',
                'pkg-agent-provider-gemini',
                'pkg-agent-provider-anthropic',
                'pkg-shared-types',
                'pkg-shared-utils'
              ]
            },
            {
              from: ['pkg-agent-provider-openai', 'pkg-agent-provider-gemini', 'pkg-agent-provider-anthropic'],
              allow: [
                'pkg-agent-provider-openai',
                'pkg-agent-provider-gemini',
                'pkg-agent-provider-anthropic',
                'pkg-agent-core',
                'pkg-agent-policies',
                'pkg-shared-types',
                'pkg-shared-utils'
              ]
            },
            {
              from: ['pkg-agent-core'],
              allow: ['pkg-agent-core', 'pkg-agent-policies', 'pkg-shared-types', 'pkg-shared-utils']
            },
            {
              from: ['pkg-agent-policies'],
              allow: ['pkg-agent-policies']
            },
            {
              from: ['pkg-shared-types', 'pkg-shared-utils'],
              allow: ['pkg-shared-types', 'pkg-shared-utils']
            }
          ]
        }
      ]
    }
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }]
    }
  }
];

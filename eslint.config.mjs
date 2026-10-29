import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { boundaries } from './tools/eslint-boundaries.mjs';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '.tools/**', 'output/**', 'tests/.compiled/**', 'scripts/awwwards-mcp.mjs', '**/next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: {
      globals: Object.fromEntries(['process', 'console', 'URL', 'Buffer', 'fetch', 'setTimeout', 'clearTimeout'].map(name => [name, 'readonly'])),
    },
    plugins: { architecture: { rules: { boundaries } } },
    rules: { 'architecture/boundaries': 'error', '@typescript-eslint/no-explicit-any': 'error' },
  },
];


import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { boundaries } from './tools/eslint-boundaries.mjs';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '.tools/**', 'output/**', 'tests/.compiled/**', 'scripts/awwwards-mcp.mjs', '**/next-env.d.ts'] },
  js.configs.recommended,
  { files: ['tests/flows/**/*.mjs'], languageOptions: { globals: Object.fromEntries(['document','window','getComputedStyle','performance','location','Event','TextDecoder','sessionStorage','localStorage','Option','requestAnimationFrame'].map(name=>[name,'readonly'])) } },
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


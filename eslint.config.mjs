import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      // "max-lines": ["warn", 250],
      // "max-lines-per-function": ["warn", 80],
      // "complexity": ["warn", 150],
      'max-depth': ['warn', 4],
    },
  },
]);

export default eslintConfig;

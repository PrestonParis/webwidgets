import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import hooksPlugin from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': hooksPlugin,
      'react-compiler': reactCompiler,
    },

    languageOptions: {
      parser: tsParser,
    },

    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
        },
      ],

      'react-compiler/react-compiler': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'max-depth': ['warn', 4],
    },
  },
]);

export default eslintConfig;

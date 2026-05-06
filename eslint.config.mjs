import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import hooksPlugin from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';
import importPlugin from 'eslint-plugin-import';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': hooksPlugin,
      'react-compiler': reactCompiler,
      import: importPlugin,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['./eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...hooksPlugin.configs.recommended.rules,

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
        },
      ],
      '@typescript-eslint/no-unsafe-return': 'error',

      'react-compiler/react-compiler': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'max-depth': ['warn', 4],
      'import/no-cycle': [
        'error',
        {
          maxDepth: 10,
          ignoreExternal: true,
        },
      ],
    },
  },

  {
    files: ['**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSInterfaceDeclaration[id.name='Props']",
          message:
            'Do not declare a `Props` interface in component files. Import it from `@/types`.',
        },
        {
          selector: "TSTypeAliasDeclaration[id.name='Props']",
          message:
            'Do not declare a `Props` type in component files. Import it from `@/types`.',
        },
        {
          selector:
            "ImportDeclaration[source.value!=/^@\\/types(\\/|$)/] > ImportSpecifier[local.name='Props']",
          message:
            'Import `Props` from `@/types` rather than local feature type files.',
        },
      ],
    },
  },
]);

export default eslintConfig;

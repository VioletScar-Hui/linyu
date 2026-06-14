import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['.wxt/**', '.output/**', 'node_modules/**', 'preview/out.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        // WXT 自动注入的全局
        browser: 'readonly',
        defineBackground: 'readonly',
        defineContentScript: 'readonly',
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'no-undef': 'off', // TS 编译器负责未定义检查
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    // Node 脚本
    files: ['scripts/**/*.mjs', 'preview/server.mjs', 'eslint.config.js', 'wxt.config.ts', 'vitest.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
);

import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import typescript from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default typescript.config(
  js.configs.recommended,
  ...typescript.configs.strict,
  ...vue.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      parserOptions: {
        parser: typescript.parser
      }
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }]
    }
  },
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'dist/**',
      '.wrangler/**',
      '**/*.min.js'
    ]
  }
)

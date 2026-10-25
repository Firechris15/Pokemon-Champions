import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

/** Ordner, die ohne DOM/Three.js/Svelte laufen müssen (Engine-Prinzip aus SPEC 3.1). */
const headless = ['src/engine/**', 'src/data/**', 'src/ai/**', 'src/teams/**'];

export default defineConfig(
  { ignores: ['dist/', 'dev-dist/', 'coverage/', 'node_modules/', 'public/'] },

  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,

  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
    },
  },

  {
    // TypeScript prüft undefinierte Namen selbst (inkl. Build-Konstanten aus src/env.d.ts).
    files: ['**/*.ts', '**/*.svelte'],
    rules: { 'no-undef': 'off' },
  },

  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        svelteConfig,
      },
    },
    rules: {
      // Fehlalarm bei `$bindable`-Props, deren Zuweisung der Elternkomponente gilt.
      'no-useless-assignment': 'off',
    },
  },

  {
    files: headless,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['three', 'three/*'],
              message: 'Headless-Code darf Three.js nicht importieren.',
            },
            {
              group: ['svelte', 'svelte/*', '*.svelte', '*.svelte.ts'],
              message: 'Headless-Code darf keine UI importieren.',
            },
            {
              group: ['**/render/**', '**/ui/**', '**/sprites/**', '**/audio/**', '**/storage/**'],
              message: 'Headless-Code darf nicht von Browser-Schichten abhängen.',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Nur den Seed-RNG verwenden – die Engine muss deterministisch sein.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Keine Uhrzeit in Headless-Code – die Engine muss deterministisch sein.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'Keine Uhrzeit in Headless-Code – die Engine muss deterministisch sein.',
        },
      ],
    },
  },

  {
    // Node-Kontext: Tests, Skripte, Konfiguration.
    files: ['tests/**', 'scripts/**', '*.config.js', '*.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    // Root-Konfigurationsdateien liegen in keinem tsconfig-Projekt für ESLint.
    files: ['*.config.js', '*.config.ts'],
    extends: [ts.configs.disableTypeChecked],
  },
);

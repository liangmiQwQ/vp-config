// Lint overrides derived from project traits.
// Each one becomes a config object scoped to the project, so every override only describes one trait.

import { category } from 'oxlint-flat-config/vite-plus'
import type { ScopedConfigItem } from 'oxlint-flat-config/vite-plus'

import type { Project } from '../../project/index.ts'
import { isBrowser, isCli, isNode, isReact, isVue } from '../../project/traits.ts'
import type { ProjectTraits } from '../../project/traits.ts'
import { lintCategories } from './base.ts'

export type LintOverride = Pick<ScopedConfigItem, 'env' | 'extends' | 'rules'>

// For code that's sure running on Node.js.
export const nodeOverride: LintOverride = {
  env: { node: true },
  // We don't enable most of the rules in this plugin, just follow the configure in lintBase.
  extends: [category({ ...lintCategories, plugins: ['node'] })],
  rules: {
    'node/no-path-concat': 'error',
    'node/no-sync': ['error', { allowAtRootLevel: true }]
  }
}

// For executables, which print to the terminal and exit with status codes.
export const cliOverride: LintOverride = {
  rules: {
    'no-console': 'off',
    'unicorn/no-process-exit': 'off'
  }
}

// This is incomplete, Oxlint's better Vue support (template support) is needed since I personally mainly develop website with Vue.js
export const browserOverride: LintOverride = {
  env: { browser: true },
  rules: {
    'prefer-dom-node-append': 'warn',
    'prefer-dom-node-dataset': 'warn',
    'unicorn/prefer-query-selector': 'warn',

    'prefer-dom-node-remove': 'warn',
    'prefer-blob-reading-methods': 'warn',

    'import/no-unassigned-import': [
      'error',
      { allow: ['**/*.{css,scss,sass,less,styl,stylus,pcss,postcss}'] }
    ],

    // Some meta framework use default export to create middlewares or apis
    'import/no-default-export': 'off',
    'unicorn/filename-case': 'off'
  }
}

// For React components, including React Ink.
export const reactOverride: LintOverride = {
  extends: [category({ ...lintCategories, plugins: ['react', 'react-perf'] })],
  rules: {
    // Suspicious
    'react/react-in-jsx-scope': 'off', // React 17+ JSX transform does not require `import React`.

    // Restriction
    'react/no-clone-element': 'error',
    'react/no-react-children': 'error',
    'react/prefer-function-component': 'error',

    // Pedantic
    'react/rules-of-hooks': 'error',

    'react/jsx-no-useless-fragment': 'warn',
    'react/no-unescaped-entities': 'warn',

    // Style
    'react/jsx-curly-brace-presence': [
      'warn',
      {
        children: 'never',
        propElementValues: 'always',
        props: 'never'
      }
    ],

    'react/jsx-max-depth': 'off',
    'react/no-redundant-should-component-update': 'off',
    'react/jsx-props-no-spreading': 'off' // Component APIs often intentionally forward JSX props.
  }
}

// For Vue components, including Vue TUI. WIP, waiting for Oxlint's Vue template support.
export const vueOverride: LintOverride = {
  env: { vue: true },
  extends: [category({ ...lintCategories, plugins: ['vue'] })],
  rules: {
    'vue/no-import-compiler-macros': 'warn',

    'vue/define-emits-declaration': ['warn', 'type-literal'],
    'vue/define-props-declaration': ['warn', 'type-based'],
    'vue/next-tick-style': ['warn', 'promise'],
    'vue/prop-name-casing': ['warn', 'camelCase'],

    'vue/require-prop-types': 'off'
  }
}

export function lintTraits(project: Project): ScopedConfigItem[] {
  return Object.entries(traitOverrides(project)).map(([trait, override]) =>
    scopeOverride(override, lintName(project.path, trait), project)
  )
}

// Names stay unique across projects, so the composer methods can find each one.
export function lintName(projectPath: string, kind: string): string {
  return projectPath === '.' ? `liangmi/${kind}` : `liangmi/${projectPath}/${kind}`
}

function scopeOverride(override: LintOverride, name: string, project: Project): ScopedConfigItem {
  return { ...override, name, files: project.scope.files, ignores: project.scope.excludeFiles }
}

function traitOverrides(project: Project): Partial<Record<keyof ProjectTraits, LintOverride>> {
  return {
    ...(isNode(project) ? { node: nodeOverride } : {}),
    ...(isBrowser(project) ? { browser: browserOverride } : {}),
    ...(isCli(project) ? { cli: cliOverride } : {}),
    ...(isReact(project) ? { react: reactOverride } : {}),
    ...(isVue(project) ? { vue: vueOverride } : {})
  }
}

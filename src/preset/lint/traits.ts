// Lint overrides derived from project traits.
// They are merged together for each project, so every override only describes one trait.

import { mergeConfig } from 'vite-plus'
import type { OxlintConfig, OxlintOverride } from 'vite-plus/lint'

import type { Project } from '../../project/index.ts'
import { isBrowser, isCli, isNode, isReact, isVue } from '../../project/traits.ts'

// For code that's sure running on Node.js.
export const nodeOverride: OxlintConfig = {
  env: { node: true },
  // We don't enable most of the rules in this plugin, just follow the configure in lintBase.
  plugins: ['node'],
  rules: {
    'node/no-path-concat': 'error',
    'node/no-sync': ['error', { allowAtRootLevel: true }]
  }
} satisfies Omit<OxlintOverride, 'files'>

// For executables, which print to the terminal and exit with status codes.
export const cliOverride: OxlintConfig = {
  rules: {
    'no-console': 'off',
    'unicorn/no-process-exit': 'off'
  }
} satisfies Omit<OxlintOverride, 'files'>

// This is incomplete, Oxlint's better Vue support (template support) is needed since I personally mainly develop website with Vue.js
export const browserOverride: OxlintConfig = {
  env: { browser: true },
  rules: {
    'prefer-dom-node-append': 'warn',
    'prefer-dom-node-dataset': 'warn',
    'unicorn/prefer-query-selector': 'warn',

    'prefer-dom-node-remove': 'warn',
    'prefer-blob-reading-methods': 'warn',

    'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],

    // Some meta framework use default export to create middlewares or apis
    'import/no-default-export': 'off',
    'unicorn/filename-case': 'off'
  }
} satisfies Omit<OxlintOverride, 'files'>

// For React components, including React Ink.
export const reactOverride: OxlintConfig = {
  plugins: ['react', 'react-perf'],
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
} satisfies Omit<OxlintOverride, 'files'>

// For Vue components, including Vue TUI. WIP, waiting for Oxlint's Vue template support.
export const vueOverride: OxlintConfig = {
  env: { vue: true },
  plugins: ['vue'],
  rules: {
    'vue/no-import-compiler-macros': 'warn',

    'vue/define-emits-declaration': ['warn', 'type-literal'],
    'vue/define-props-declaration': ['warn', 'type-based'],
    'vue/next-tick-style': ['warn', 'promise'],
    'vue/prop-name-casing': ['warn', 'camelCase'],

    'vue/require-prop-types': 'off'
  }
} satisfies Omit<OxlintOverride, 'files'>

export function lintTraits(project: Project): OxlintConfig {
  let config: OxlintConfig = {}

  for (const override of traitOverrides(project)) {
    config = mergeConfig<OxlintConfig, OxlintConfig>(config, override)
  }

  return config
}

function traitOverrides(project: Project): OxlintConfig[] {
  return [
    isNode(project) ? nodeOverride : undefined,
    isBrowser(project) ? browserOverride : undefined,
    isCli(project) ? cliOverride : undefined,
    isReact(project) ? reactOverride : undefined,
    isVue(project) ? vueOverride : undefined
  ].filter(override => override !== undefined)
}

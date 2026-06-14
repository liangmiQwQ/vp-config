import type { OxlintConfig } from 'vite-plus/lint'

// Some lint shard override.
// They should be used in combination mostly.

// For code that's sure running on Node.js, mainly for CLI use.
export const cliOverride: OxlintConfig = {
  env: { node: true },
  // We don't enable most of the rules in this plugin, just follow the configure in lintBase.
  plugins: ['node'],
  rules: {
    'no-console': 'off',
    'unicorn/no-process-exit': 'off',
    'node/no-path-concat': 'error'
  }
}

// For React and Vue component. There is no web-specific or node-specific rules so it can be used for both cli and website
export const componentOverride: OxlintConfig = {
  env: { vue: true },
  plugins: ['react', 'react-perf', 'vue'],
  rules: {
    // React 17+ JSX transform does not require `import React`.
    'react/react-in-jsx-scope': 'off',

    // Component APIs often intentionally forward JSX props.
    'react/jsx-props-no-spreading': 'off',

    // We prefer function components, so class-component style rules are not useful.
    'react/no-set-state': 'off',
    'react/prefer-es6-class': 'off',
    'react/state-in-constructor': 'off',

    'react/no-clone-element': 'error',
    'react/no-react-children': 'error',
    'react/prefer-function-component': 'error',

    'react/rules-of-hooks': 'error',

    'react/jsx-no-useless-fragment': 'warn',
    'react/no-unescaped-entities': 'warn'
  }
}

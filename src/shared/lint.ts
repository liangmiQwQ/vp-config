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
  plugins: ['react', 'react-perf', 'vue' /* WIP */],
  rules: {
    // Suspicious
    'react/react-in-jsx-scope': 'off', // React 17+ JSX transform does not require `import React`.

    // Restriction
    'react/no-clone-element': 'error',
    'react/no-react-children': 'error',
    'react/prefer-function-component': 'error',

    'vue/no-import-compiler-macros': 'warn',

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
    'vue/define-emits-declaration': ['warn', 'type-literal'],
    'vue/define-props-declaration': ['warn', 'type-based'],
    'vue/next-tick-style': ['warn', 'promise'],
    'vue/prop-name-casing': ['warn', 'camelCase'],

    'vue/require-prop-types': 'off',
    'react/jsx-max-depth': 'off',
    'react/no-redundant-should-component-update': 'off',
    'react/jsx-props-no-spreading': 'off' // Component APIs often intentionally forward JSX props.
  }
}

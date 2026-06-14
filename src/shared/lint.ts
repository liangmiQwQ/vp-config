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
  plugins: ['jsx-a11y', 'react', 'react-perf', 'vue']
}

// Lint overrides for file roles. Globs are relative to the project and rebased under the project path.

import { mergeConfig } from 'vite-plus'
import type { OxlintConfig, OxlintOverride } from 'vite-plus/lint'

import { rebaseGlobs } from '../../project/index.ts'
import { cliOverride, nodeOverride } from './traits.ts'

const testOverride: OxlintOverride = {
  env: {
    node: true,
    // We do not use jest
    vitest: true
  },
  plugins: ['vitest'],
  rules: {
    // Style
    'vitest/consistent-test-filename': ['warn', { pattern: '.*.test.ts$' }],
    'vitest/consistent-test-it': ['warn', { fn: 'it', withinDescribe: 'it' }],

    'vitest/no-hooks': 'off',
    'vitest/require-top-level-describe': 'off',
    'vitest/prefer-strict-boolean-matchers': 'off',
    'vitest/max-expects': 'off',
    'vitest/prefer-expect-assertions': 'off',
    'vitest/prefer-importing-vitest-globals': 'off', // Conflict with `vite-plus/test`
    'vitest/no-importing-vitest-globals': 'off',
    'vitest/padding-around-test-blocks': 'off',
    'vitest/no-large-snapshots': 'off',
    'vitest/no-restricted-matchers': 'off',
    'vitest/no-restricted-vi-methods': 'off'
  },
  files: ['**/*.test.ts', '**/*.spec.ts']
}

// Scripts are Node.js programs printing to the terminal.
const scriptOverride: OxlintOverride = {
  ...mergeConfig<OxlintConfig, OxlintConfig>(nodeOverride, cliOverride),
  files: ['scripts/**', 'script/**', '*.ts', '*.js']
}

const configFileOverride: OxlintOverride = {
  rules: {
    'import/no-default-export': 'off',
    'no-console': 'error'
  },
  files: ['**/*.config.ts']
}

const roleOverrides = [testOverride, scriptOverride, configFileOverride]

export function lintRoles(projectPath: string): OxlintOverride[] {
  return roleOverrides.map(override => rebaseOverride(override, projectPath))
}

function rebaseOverride(override: OxlintOverride, projectPath: string): OxlintOverride {
  return { ...override, files: rebaseGlobs(override.files, projectPath) }
}

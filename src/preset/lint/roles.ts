// Lint overrides for file roles. Globs are relative to the project and rebased under the project path.

import { category } from 'oxlint-flat-config/vite-plus'
import type { ScopedConfigItem } from 'oxlint-flat-config/vite-plus'
import { mergeConfig } from 'vite-plus'

import { rebaseGlobs } from '../../project/index.ts'
import { lintCategories } from './base.ts'
import { cliOverride, lintName, nodeOverride } from './traits.ts'
import type { LintOverride } from './traits.ts'

type RoleOverride = LintOverride & { files: string[] }

const testOverride: RoleOverride = {
  env: {
    node: true,
    // We do not use jest
    vitest: true
  },
  extends: [category({ ...lintCategories, plugins: ['vitest'] })],
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
const scriptOverride: RoleOverride = {
  ...mergeConfig<LintOverride, LintOverride>(nodeOverride, cliOverride),
  files: ['scripts/**', 'script/**', '*.ts', '*.js']
}

const configFileOverride: RoleOverride = {
  rules: {
    'import/no-default-export': 'off',
    'no-console': 'error'
  },
  files: ['**/*.config.ts']
}

const roleOverrides: Record<string, RoleOverride> = {
  test: testOverride,
  script: scriptOverride,
  'config-file': configFileOverride
}

export function lintRoles(projectPath: string): ScopedConfigItem[] {
  return Object.entries(roleOverrides).map(([role, override]) =>
    rebaseOverride(override, lintName(projectPath, role), projectPath)
  )
}

function rebaseOverride(
  override: RoleOverride,
  name: string,
  projectPath: string
): ScopedConfigItem {
  return { ...override, name, files: rebaseGlobs(override.files, projectPath) }
}

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vite-plus/test'

import { lintBase } from '../src/base/lint.ts'
import { getAllowedConfigNames, isVpConfigImportAllowed } from '../src/oxlint-plugin.ts'

test('allows project categories from project vite config', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'project' })
    writeFileSync(join(project, 'index.html'), '')
    const configPath = join(project, 'vite.config.ts')

    expect(getAllowedConfigNames(configPath)).toEqual(['cli', 'lib', 'website'])
    expect(isVpConfigImportAllowed(configPath, ['lib'])).toBe(true)
    expect(isVpConfigImportAllowed(configPath, ['base'])).toBe(false)
  })
})

test('allows base category from workspace root vite config', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'root' })
    writeFileSync(join(project, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
    const rootConfigPath = join(project, 'vite.config.ts')

    expect(getAllowedConfigNames(rootConfigPath)).toEqual(['base'])
    expect(isVpConfigImportAllowed(rootConfigPath, ['base'])).toBe(true)
    expect(isVpConfigImportAllowed(rootConfigPath, ['lib'])).toBe(false)
  })
})

test('allows project categories when config has a package signal', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'workspace-package' })
    writeFileSync(join(project, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
    const configPath = join(project, 'vite.config.ts')

    expect(getAllowedConfigNames(configPath, true)).toEqual(['cli', 'lib', 'website'])
    expect(isVpConfigImportAllowed(configPath, ['lib'], true)).toBe(true)
    expect(isVpConfigImportAllowed(configPath, ['base'], true)).toBe(false)
  })
})

test('registers liangmi oxlint plugin in base lint config', () => {
  expect(lintBase).toMatchObject({
    jsPlugins: [
      {
        name: 'liangmi',
        specifier: '@liangmi/vp-config/oxlint-plugin'
      }
    ],
    rules: {
      'liangmi/load-vp-config-correctly': 'error'
    }
  })
})

function withTempProject(run: (project: string) => void): void {
  const project = mkdtempSync(join(tmpdir(), 'vp-config-'))

  try {
    run(project)
  } finally {
    rmSync(project, { recursive: true, force: true })
  }
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

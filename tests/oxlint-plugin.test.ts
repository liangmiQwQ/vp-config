import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vite-plus/test'

import { lintBase } from '../src/base/lint.ts'
import { viteConfigNames } from '../src/oxlint-plugin/constants.ts'
import {
  cleanupRuntimeInfo,
  getAllowedConfigNames,
  isVpConfigImportAllowed,
  readRuntimeInfo,
  writeRuntimeInfo
} from '../src/oxlint-plugin/index.ts'
import { findConfigFileFromStack, shouldCleanupRuntimeInfo } from '../src/oxlint-plugin/info.ts'

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

    writeRuntimeInfoForConfig(configPath, 'lib', { lint: {}, pack: {} })

    expect(getAllowedConfigNames(configPath)).toEqual(['cli', 'lib', 'website'])
    expect(isVpConfigImportAllowed(configPath, ['lib'])).toBe(true)
    expect(isVpConfigImportAllowed(configPath, ['base'])).toBe(false)
    cleanupRuntimeInfo(project)
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
      'liangmi/no-orphan-vite-config': 'error',
      'liangmi/no-useless-vp-preset-imports': 'error',
      'liangmi/use-preset-vp-config': 'error',
      'liangmi/load-proper-vp-config-category': 'error',
      'liangmi/no-mixed-project': 'error',
      'liangmi/cleanup': 'error'
    }
  })
})

test('writes runtime info beside vite config and cleans it up', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'cli-project', bin: './dist/cli.mjs' })
    const configPath = join(project, 'vite.config.ts')

    writeRuntimeInfoForConfig(configPath, 'cli', { lint: {}, pack: {} })

    expect(readRuntimeInfo(project)).toMatchObject({
      category: 'cli',
      configFile: configPath,
      configDirectory: project,
      configKeys: ['lint', 'pack'],
      project: {
        hasPack: true,
        hasPackageBin: true,
        isLib: true,
        isCli: true,
        isProject: true
      }
    })

    cleanupRuntimeInfo(project)
    expect(readRuntimeInfo(project)).toBeUndefined()
  })
})

test('finds vite config files from windows stack paths', () => {
  const configPath = String.raw`C:\Users\runneradmin\AppData\Local\Temp\vp-config-abc123\vite.config.ts`

  expect(findConfigFileFromStack(`Error\n    at config (${configPath}:1:1)`)).toBe(configPath)
})

test('tracks every vite config filename supported by local vite-plus', () => {
  expect(viteConfigNames).toEqual([
    'vite.config.ts',
    'vite.config.mts',
    'vite.config.cts',
    'vite.config.js',
    'vite.config.mjs',
    'vite.config.cjs'
  ])
})

test('disables cleanup in oxlint lsp mode', () => {
  expect(shouldCleanupRuntimeInfo(['node', 'oxlint', '--lsp'])).toBe(false)
  expect(shouldCleanupRuntimeInfo(['node', 'oxlint'])).toBe(true)
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

function writeRuntimeInfoForConfig(
  configPath: string,
  category: 'base' | 'cli' | 'lib' | 'website',
  config: Record<string, unknown>
): void {
  process.env.VP_COMMAND = 'check'
  const previousStackTraceLimit = Error.stackTraceLimit
  Error.stackTraceLimit = 20

  try {
    callWithConfigStack(configPath, () => {
      writeRuntimeInfo({ category, config })
    })
  } finally {
    Error.stackTraceLimit = previousStackTraceLimit
    delete process.env.VP_COMMAND
  }
}

function callWithConfigStack(configPath: string, run: () => void): void {
  const originalPrepareStackTrace = Reflect.get(Error, 'prepareStackTrace')
  Error.prepareStackTrace = (): string => `Error\n    at config (${configPath}:1:1)`

  try {
    run()
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace
  }
}

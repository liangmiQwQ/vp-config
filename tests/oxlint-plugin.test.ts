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
      'liangmi/no-mixed-project': 'error'
    }
  })
  expect(lintBase.rules).toHaveProperty('liangmi/cleanup')
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
  withTempProject(project => {
    expect(shouldCleanupRuntimeInfo(project, ['node', 'oxlint', '--lsp'])).toBe(false)
    expect(shouldCleanupRuntimeInfo(project, ['node', 'oxlint'])).toBe(true)
  })
})

test('keeps runtime info when project oxlint lsp is running', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'lsp-project' })
    const configPath = join(project, 'vite.config.ts')

    withProcessArgv(['node', 'oxlint', '--lsp'], () => {
      writeRuntimeInfoForConfig(configPath, 'base', { lint: {} })
    })

    expect(readRuntimeInfo(project)).toMatchObject({
      cleanup: {
        lspPid: process.pid
      }
    })
    expect(shouldCleanupRuntimeInfo(project, ['node', 'oxlint'])).toBe(false)
    cleanupRuntimeInfo(project)
  })
})

test('writes runtime info from config stack during vite-plus check', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'check-project' })
    const configPath = join(project, 'vite.config.ts')

    withVpCommand('check', () => {
      callWithConfigStack(
        configPath,
        () => {
          writeRuntimeInfo({ category: 'base', config: { lint: {} } })
        },
        'loadVitePlusConfigs'
      )
    })

    expect(readRuntimeInfo(project)).toMatchObject({
      category: 'base',
      configFile: configPath
    })
    cleanupRuntimeInfo(project)
  })
})

test('does not write runtime info from package stack without lint entry', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'plain-project' })
    const configPath = join(project, 'vite.config.ts')

    callWithStack(
      `Error\n    at info (src/oxlint-plugin/info.ts:1:1)\n    at config (${configPath}:1:1)`,
      () => {
        writeRuntimeInfo({ category: 'base', config: { lint: {} } })
      }
    )

    expect(readRuntimeInfo(project)).toBeUndefined()
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

function writeRuntimeInfoForConfig(
  configPath: string,
  category: 'base' | 'cli' | 'lib' | 'website',
  config: Record<string, unknown>
): void {
  const previousStackTraceLimit = Error.stackTraceLimit
  Error.stackTraceLimit = 20

  try {
    callWithConfigStack(configPath, () => {
      writeRuntimeInfo({ category, config })
    })
  } finally {
    Error.stackTraceLimit = previousStackTraceLimit
  }
}

function callWithConfigStack(configPath: string, run: () => void, stackEntry = 'oxlint'): void {
  callWithStack(
    `Error\n    at ${stackEntry} (node_modules/oxlint/dist/cli.js:1:1)\n    at config (${configPath}:1:1)`,
    run
  )
}

function withProcessArgv(argv: string[], run: () => void): void {
  const originalArgv = process.argv
  process.argv = argv

  try {
    run()
  } finally {
    process.argv = originalArgv
  }
}

function withVpCommand(command: string, run: () => void): void {
  const originalCommand = process.env.VP_COMMAND
  process.env.VP_COMMAND = command

  try {
    run()
  } finally {
    if (originalCommand === undefined) {
      delete process.env.VP_COMMAND
    } else {
      process.env.VP_COMMAND = originalCommand
    }
  }
}

function callWithStack(stack: string, run: () => void): void {
  const originalPrepareStackTrace = Reflect.get(Error, 'prepareStackTrace')
  Error.prepareStackTrace = (): string => stack

  try {
    run()
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace
  }
}

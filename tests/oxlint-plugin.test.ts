import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

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
import { ensureRuntimeInfo, findConfigFileFromStack } from '../src/oxlint-plugin/info.ts'
import {
  loadProperVpConfigCategoryRule,
  noMixedProjectRule,
  usePresetVpConfigRule
} from '../src/oxlint-plugin/rules.ts'

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
  expect(lintBase.rules).not.toHaveProperty('liangmi/cleanup')
})

test('writes runtime info beside vite config and cleans it up', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'project' })
    const configPath = join(project, 'vite.config.ts')

    writeRuntimeInfoForConfig(configPath, 'cli', { lint: {}, pack: {} })

    const info = readRuntimeInfo(project)

    expect(info).toMatchObject({
      category: 'cli',
      configFile: configPath,
      configDirectory: project,
      configKeys: ['lint', 'pack'],
      project: {
        hasPack: true
      }
    })
    expect(info?.project).not.toHaveProperty('isWebsite')
    expect(info?.project).not.toHaveProperty('isLib')
    expect(info?.project).not.toHaveProperty('isCli')
    expect(info?.project).not.toHaveProperty('isProject')
    expect(info?.project).not.toHaveProperty('hasPackageBin')

    cleanupRuntimeInfo(project)
    expect(readRuntimeInfo(project)).toBeUndefined()
  })
})

test('ensures runtime info by loading vite config from oxlint plugin', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'direct-oxlint-project' })
    const configPath = join(project, 'vite.config.ts')
    const entryUrl = pathToFileURL(join(process.cwd(), 'src/index.ts')).href
    writeFileSync(
      configPath,
      `import { lib } from ${JSON.stringify(entryUrl)}\n\nexport default lib({ lint: {}, pack: {} })\n`
    )

    const info = ensureRuntimeInfo(configPath)

    expect(info).toMatchObject({ category: 'lib' })
    expect(info?.configKeys).toEqual(expect.arrayContaining(['lint', 'pack']))
    cleanupRuntimeInfo(project)
  })
})

test('skips runtime info rules for orphan vite config', () => {
  withTempProject(project => {
    const configPath = join(project, 'vite.config.ts')

    writeFileSync(
      configPath,
      "import { lib } from '@liangmi/vp-config'\n\nexport default lib({ lint: {}, pack: {}, plugins: [] })\n"
    )

    expect(ensureRuntimeInfo(configPath)).toBeUndefined()
    expect(readRuntimeInfo(project)).toBeUndefined()
    expect(runProgramRule(usePresetVpConfigRule, configPath)).toEqual([])
    expect(runProgramRule(loadProperVpConfigCategoryRule, configPath)).toEqual([])
    expect(runProgramRule(noMixedProjectRule, configPath)).toEqual([])
  })
})

test('detects vite config fields by excluding vite-plus specific fields', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'website-config-project' })
    const configPath = join(project, 'vite.config.ts')

    writeRuntimeInfoForConfig(configPath, 'website', { lint: {}, server: {}, test: {} })

    expect(readRuntimeInfo(project)).toMatchObject({
      project: {
        hasViteConfigFields: true,
        hasPack: false
      }
    })
    cleanupRuntimeInfo(project)
  })
})

test('uses live index.html signal when runtime info exists', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'static-site-project' })
    const configPath = join(project, 'vite.config.ts')

    writeRuntimeInfoForConfig(configPath, 'base', { lint: {} })

    expect(getAllowedConfigNames(configPath)).toEqual(['base'])

    writeFileSync(join(project, 'index.html'), '')

    expect(getAllowedConfigNames(configPath)).toEqual(['cli', 'lib', 'website'])
    cleanupRuntimeInfo(project)
  })
})

test('reports current runtime category mismatch for local project config entry', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'category-project' })
    const configPath = join(project, 'vite.config.ts')
    writeFileSync(
      configPath,
      "import { lib } from './src/index.ts'\n\nexport default lib({ lint: {}, pack: {} })\n"
    )

    expect(ensureRuntimeInfo(configPath)).toMatchObject({ category: 'lib' })

    writeFileSync(
      configPath,
      "import { base } from './src/index.ts'\n\nexport default base({ lint: {}, pack: {} })\n"
    )

    const reports = runLoadProperVpConfigCategoryRule(configPath)

    expect(readRuntimeInfo(project)).toMatchObject({
      category: 'base',
      project: {
        hasPack: true
      }
    })
    expect(reports).toMatchObject([
      {
        node: {
          type: 'Program'
        },
        messageId: 'wrongCategory',
        data: {
          expected: '{ cli } or { lib } or { website }'
        }
      }
    ])
    cleanupRuntimeInfo(project)
  })
})

test('finds vite config files from windows stack paths', () => {
  const configPath = String.raw`C:\Users\runneradmin\AppData\Local\Temp\vp-config-abc123\vite.config.ts`

  expect(findConfigFileFromStack(`Error\n    at config (${configPath}:1:1)`)).toBe(configPath)
})

test('maps bundled vite temp stack paths to project config files', () => {
  const configPath = '/tmp/vp-config/node_modules/.vite-temp/vite.config.ts'

  expect(findConfigFileFromStack(`Error\n    at config (${configPath}:1:1)`)).toBe(
    join('/tmp/vp-config', 'vite.config.ts')
  )
})

test('maps windows bundled vite temp stack paths to project config files', () => {
  const configPath = String.raw`C:\Users\runneradmin\AppData\Local\Temp\vp-config-abc123\node_modules\.vite-temp\vite.config.ts`

  expect(findConfigFileFromStack(`Error\n    at config (${configPath}:1:1)`)).toBe(
    String.raw`C:\Users\runneradmin\AppData\Local\Temp\vp-config-abc123\vite.config.ts`
  )
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

test('writes runtime info from config stack during vite-plus check', () => {
  withTempProject(project => {
    writeJson(join(project, 'package.json'), { name: 'check-project' })
    const configPath = join(project, 'vite.config.ts')

    callWithStack(
      `Error\n    at resolveUniversalViteConfig (${join(
        project,
        'node_modules/vite-plus/dist/resolve-vite-config-abc123.js'
      )}:1:1)\n    at config (${configPath}:1:1)`,
      () => {
        writeRuntimeInfo({ category: 'base', config: { lint: {} } })
      }
    )

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

function callWithStack(stack: string, run: () => void): void {
  const originalPrepareStackTrace = Reflect.get(Error, 'prepareStackTrace')
  Error.prepareStackTrace = (): string => stack

  try {
    run()
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace
  }
}

interface RuleReport {
  messageId: string
  data?: Record<string, string>
  node?: {
    type: string
  }
}

function runLoadProperVpConfigCategoryRule(filename: string): RuleReport[] {
  return runProgramRule(loadProperVpConfigCategoryRule, filename)
}

function runProgramRule(rule: unknown, filename: string): RuleReport[] {
  const reports: RuleReport[] = []
  const programRule = rule as {
    create: (context: { filename: string; report: (report: RuleReport) => void }) => {
      Program?: (node: { type: 'Program' }) => void
    }
  }
  const visitor = programRule.create({
    filename,
    report: report => {
      reports.push(report)
    }
  })
  const visitProgram = visitor.Program

  visitProgram?.({ type: 'Program' })

  return reports
}

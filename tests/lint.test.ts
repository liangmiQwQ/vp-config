import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import type { UserConfig } from 'vite-plus'
import { expect, it } from 'vite-plus/test'

import { createConfigEntry } from '../src/entry.ts'
import { cli } from '../src/index.ts'

const require = createRequire(import.meta.url)

function getOxlintBaseStyleRules(): string[] {
  const vitePlusPackagePath = require.resolve('vite-plus/package.json')
  const oxlintBinPath = join(dirname(vitePlusPackagePath), '..', 'oxlint', 'bin', 'oxlint')
  const tempDirectory = mkdtempSync(join(tmpdir(), 'vp-config-oxlint-rules-'))
  const filePath = join(tempDirectory, 'index.ts')

  writeFileSync(filePath, 'const value = 1\n')

  try {
    const output = execFileSync(
      process.execPath,
      [
        oxlintBinPath,
        '--print-config',
        '-A',
        'all',
        '-W',
        'style',
        '--import-plugin',
        '--promise-plugin',
        filePath
      ],
      { encoding: 'utf8' }
    )
    const config = JSON.parse(output) as { rules: Record<string, unknown> }

    return Object.keys(config.rules).toSorted()
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true })
  }
}

it('should merge lint fields', () => {
  const config = createConfigEntry({
    lint: {
      options: {
        typeAware: true
      },
      rules: {
        eqeqeq: 'error'
      }
    }
  })
  const userLint: NonNullable<UserConfig['lint']> = {
    options: {
      denyWarnings: true
    },
    rules: {
      eqeqeq: 'off'
    }
  }

  expect(config({ lint: userLint })).toMatchObject({
    lint: {
      options: {
        denyWarnings: true,
        typeAware: true
      },
      rules: {
        eqeqeq: 'off'
      }
    }
  })
})

it('should merge CLI and component lint overrides once', () => {
  const { lint } = cli({})
  const plugins = lint?.plugins ?? []

  expect(lint).toMatchObject({
    env: {
      node: true,
      vue: true
    },
    rules: {
      'no-console': 'off'
    }
  })
  expect(plugins).toStrictEqual(expect.arrayContaining(['node', 'react', 'vue']))
  expect(plugins).toStrictEqual([...new Set(plugins)])
})

it('should enable style rules with whitelist mode', () => {
  const { lint } = cli({})
  const rules = lint?.rules ?? {}
  const styleRules = getOxlintBaseStyleRules()

  expect(lint).toMatchObject({
    categories: {
      style: 'off'
    },
    rules: {
      'func-names': ['warn', 'never'],
      'import/exports-last': 'off',
      'no-duplicate-imports': ['warn', { allowSeparateTypeImports: true }],
      'typescript/consistent-type-definitions': ['warn', 'interface'],
      'unicorn/prefer-ternary': ['warn', 'only-single-line']
    }
  })

  expect(styleRules.length).toBe(145)
  expect(styleRules.filter(rule => !Object.hasOwn(rules, rule))).toStrictEqual([])
})

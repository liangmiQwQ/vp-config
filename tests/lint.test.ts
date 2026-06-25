import type { UserConfig } from 'vite-plus'
import { expect, it } from 'vite-plus/test'

import { createConfigEntry } from '../src/entry.ts'
import { cli } from '../src/index.ts'

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

  expect(lint).toMatchObject({
    categories: {
      style: 'off'
    },
    rules: {
      'no-duplicate-imports': ['warn', { allowSeparateTypeImports: true }]
    }
  })
  expect(rules).not.toHaveProperty('import/exports-last')
})

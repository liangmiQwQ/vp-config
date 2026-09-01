import type { UserConfig } from 'vite-plus'
import { expect, it } from 'vite-plus/test'

import { createConfigEntry } from '../src/entry.ts'
import { base, cli } from '../src/index.ts'

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

it('should only enable selected style rules', () => {
  const { lint } = base({})

  expect(lint).toMatchObject({
    categories: {
      style: 'off'
    },
    rules: {
      'typescript/consistent-type-definitions': ['warn', 'interface']
    }
  })
  expect(lint?.rules).not.toHaveProperty('unicorn/explicit-timer-delay')
  expect(lint?.overrides?.[0]).toMatchObject({
    files: ['*.test.ts', '*.spec.ts'],
    rules: {
      'vitest/padding-around-test-blocks': 'off'
    }
  })
})

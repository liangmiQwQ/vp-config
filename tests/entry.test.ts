import type { ConfigEnv, UserConfig } from 'vite-plus'
import { expect, test } from 'vite-plus/test'

import { createConfigEntry } from '../src/entry.ts'
import type { PresetConfig } from '../src/entry.ts'

const presetConfig = {
  fmt: {
    semi: false
  },
  lint: {
    options: {
      typeAware: true
    },
    rules: {
      eqeqeq: 'error'
    }
  },
  pack: {
    dts: true,
    exports: true
  },
  staged: {
    '*': 'vp check'
  }
} satisfies PresetConfig

test('should merge preset with object config', () => {
  const config = createConfigEntry(presetConfig)

  expect(config({ fmt: { semi: true } })).toMatchObject({
    fmt: {
      semi: true
    },
    staged: {
      '*': 'vp check'
    },
    pack: {
      dts: true,
      exports: true
    }
  })
})

test('should merge preset with promise config', async () => {
  const config = createConfigEntry(presetConfig)

  await expect(config(Promise.resolve({ fmt: { semi: true } }))).resolves.toMatchObject({
    fmt: {
      semi: true
    },
    staged: {
      '*': 'vp check'
    },
    pack: {
      dts: true,
      exports: true
    }
  })
})

test('should merge preset with function config after Vite+ provides env', async () => {
  const config = createConfigEntry(presetConfig)
  const userConfig = config(env => ({
    fmt: {
      semi: env.mode === 'test'
    }
  }))
  const env = { command: 'serve', mode: 'test' } as ConfigEnv

  expect(typeof userConfig).toBe('function')
  await expect(userConfig(env)).resolves.toMatchObject({
    fmt: {
      semi: true
    },
    staged: {
      '*': 'vp check'
    },
    pack: {
      dts: true,
      exports: true
    }
  })
})

test('should merge only selected preset parts', () => {
  const config = createConfigEntry(presetConfig)
  const mergedConfig = config.only(['fmt'], { staged: { '*': 'vp test' } })

  expect(mergedConfig).toMatchObject({
    fmt: {
      semi: false
    },
    staged: {
      '*': 'vp test'
    }
  })
  expect(mergedConfig).not.toHaveProperty('lint')
  expect(mergedConfig).not.toHaveProperty('pack')
})

test('should merge preset after excluding selected parts', () => {
  const config = createConfigEntry(presetConfig)

  expect(config.exclude(['fmt'], { fmt: { semi: true } })).toMatchObject({
    fmt: {
      semi: true
    },
    staged: {
      '*': 'vp check'
    },
    pack: {
      dts: true,
      exports: true
    }
  })
})

test('should merge lint fields', () => {
  const config = createConfigEntry(presetConfig)
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

test('should merge pack preset with object config', () => {
  const config = createConfigEntry(presetConfig)

  expect(
    config({
      pack: {
        exports: false,
        minify: true
      }
    })
  ).toMatchObject({
    pack: {
      dts: true,
      exports: false,
      minify: true
    }
  })
})

test('should merge pack preset with every array item', () => {
  const config = createConfigEntry(presetConfig)

  expect(
    config({
      pack: [
        {
          entry: ['./src/index.ts']
        },
        {
          dts: false,
          entry: ['./src/cli.ts']
        }
      ]
    })
  ).toMatchObject({
    pack: [
      {
        dts: true,
        entry: ['./src/index.ts'],
        exports: true
      },
      {
        dts: false,
        entry: ['./src/cli.ts'],
        exports: true
      }
    ]
  })
})

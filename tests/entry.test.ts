import type { ConfigEnv, UserConfig } from 'vite-plus'
import { expect, it } from 'vite-plus/test'

import { createConfigEntry } from '../src/entry.ts'
import type { PresetConfig } from '../src/entry.ts'
import { base, cli, lib, website } from '../src/index.ts'

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

it('should merge preset with object config', () => {
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

it('should merge preset with promise config', async () => {
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

it('should merge preset with function config after Vite+ provides env', async () => {
  const config = createConfigEntry(presetConfig)
  const userConfig = config(env => ({
    fmt: {
      semi: env.mode === 'test'
    }
  }))
  const env = { command: 'serve', mode: 'test' } as ConfigEnv

  expect(userConfig).toBeTypeOf('function')
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

it('should merge only selected preset parts', () => {
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

it('should merge preset after excluding selected parts', () => {
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

it('should merge lint fields', () => {
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

it('should merge pack preset with object config', () => {
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

it('should merge pack preset with every array item', () => {
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

it('should include shared config in every preset category', () => {
  for (const config of [base, cli, lib, website]) {
    const preset = config({})

    for (const task of ['cbuild', 'ccheck', 'cfmt', 'cformat', 'clint', 'cpack', 'ctest']) {
      expect(preset.run?.tasks).toHaveProperty(task)
    }

    expect(preset).toMatchObject({
      staged: {
        '*': 'vp check --fix'
      }
    })
  }
})

it('should merge CLI and component lint overrides once', () => {
  const lint = cli({}).lint
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
  expect(plugins).toEqual(expect.arrayContaining(['node', 'react', 'vue']))
  expect(plugins).toStrictEqual([...new Set(plugins)])
})

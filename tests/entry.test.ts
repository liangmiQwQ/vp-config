import type { ConfigEnv } from 'vite-plus'
import { expect, it } from 'vite-plus/test'

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

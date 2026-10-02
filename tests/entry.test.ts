import { join } from 'node:path'

import type { ConfigEnv } from 'vite-plus'
import { afterEach, expect, it, vi } from 'vite-plus/test'

import { liangmi } from '../src/index.ts'

const workspace = join(import.meta.dirname, 'fixtures/workspace')

// Tests are not loaded from a vite.config.ts, so the entry falls back to the working directory.
function useWorkingDirectory(directory: string): void {
  vi.spyOn(process, 'cwd').mockReturnValue(directory)
}

afterEach(() => {
  vi.restoreAllMocks()
})

it('should emit every part for a single-package repo', async () => {
  const config = await liangmi({ fmt: { semi: true } })

  expect(config.fmt).toMatchObject({ semi: true, singleQuote: true })
  expect(config.lint).toMatchObject({ env: { node: true } })
  expect(config.pack).toMatchObject({ exports: true })
  expect(config.test).toMatchObject({ environment: 'node' })
  expect(config.staged).toMatchObject({ '*': 'vp check --fix' })
  expect(config.run?.tasks).toHaveProperty('ccheck')
})

it('should merge preset with promise config', async () => {
  const config = await liangmi(Promise.resolve({ pack: { minify: true } }))

  expect(config.pack).toMatchObject({ exports: true, minify: true })
})

it('should merge preset with function config after Vite+ provides env', async () => {
  const config = await liangmi((env: ConfigEnv) => ({ fmt: { semi: env.mode === 'test' } }))
  const env = { command: 'serve', mode: 'test' } as ConfigEnv

  expect(config).toBeTypeOf('function')
  await expect(config(env)).resolves.toMatchObject({
    fmt: { semi: true },
    staged: { '*': 'vp check --fix' }
  })
})

it('should load only selected parts', async () => {
  const config = await liangmi({ staged: { '*': 'vp test' } }).only(['fmt'])

  expect(config.fmt).toMatchObject({ semi: false })
  expect(config.staged).toStrictEqual({ '*': 'vp test' })
  expect(config).not.toHaveProperty('lint')
  expect(config).not.toHaveProperty('pack')
})

it('should exclude selected parts', async () => {
  const config = await liangmi({}).exclude(['staged', 'pack'])

  expect(config).not.toHaveProperty('staged')
  expect(config).not.toHaveProperty('pack')
  expect(config).toHaveProperty('lint')
})

it('should apply declared project facts', async () => {
  const config = await liangmi({}).option({ projects: { '.': { runtime: 'browser' } } })

  expect(config.lint).toMatchObject({ env: { browser: true } })
  expect(config.test).toBeUndefined()
})

it('should emit workspace parts at the workspace root', async () => {
  useWorkingDirectory(workspace)

  const config = await liangmi({})

  expect(config.lint?.overrides?.[0]).toMatchObject({ files: ['apps/web/**'] })
  expect(config).toHaveProperty('staged')
  expect(config).toHaveProperty('run')
  expect(config).not.toHaveProperty('pack')
  expect(config).not.toHaveProperty('test')
})

it('should emit project parts for a workspace member', async () => {
  useWorkingDirectory(join(workspace, 'apps/web'))

  const config = await liangmi({})

  expect(config.test).toStrictEqual({ environment: 'happy-dom' })
  expect(config).toHaveProperty('run')
  expect(config).not.toHaveProperty('lint')
  expect(config).not.toHaveProperty('fmt')
  expect(config).not.toHaveProperty('staged')
})

it('should reject lint and fmt in a workspace member', async () => {
  useWorkingDirectory(join(workspace, 'packages/lib'))

  await expect(liangmi({ lint: { rules: {} } })).rejects.toThrow(
    /`lint` in .* is ignored by Vite\+/u
  )
})

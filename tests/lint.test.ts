import { join } from 'node:path'

import { expect, it } from 'vite-plus/test'

import { deriveLint } from '../src/preset/lint/index.ts'
import { resolveProjectContext } from '../src/project/index.ts'
import { createTestProject } from './project-fixture.ts'

const workspace = join(import.meta.dirname, 'fixtures/workspace')

const cliProject = createTestProject({ packageBin: true, packageDependencies: ['react'] })

it('should merge traits into the top level for a single project', () => {
  const lint = deriveLint([cliProject])
  const plugins = lint.plugins ?? []

  expect(lint).toMatchObject({
    env: { node: true },
    rules: {
      'no-console': 'off',
      'react/rules-of-hooks': 'error'
    }
  })
  expect(plugins).toStrictEqual(expect.arrayContaining(['node', 'react']))
  expect(plugins).toStrictEqual([...new Set(plugins)])
  expect(lint.overrides?.map(override => override.files)).toStrictEqual([
    ['./**/*.test.ts', './**/*.spec.ts'],
    ['./scripts/**', './script/**', './*.ts', './*.js'],
    ['./**/*.config.ts']
  ])
})

it('should preserve style rules through an allowlist', () => {
  const lint = deriveLint([cliProject])

  expect(lint).toMatchObject({
    categories: {
      style: 'off'
    },
    rules: {
      curly: 'warn',
      'typescript/consistent-type-definitions': ['warn', 'interface']
    }
  })
  expect(lint.rules).not.toHaveProperty('unicorn/explicit-timer-delay')
})

it('should generate scoped overrides for workspace projects', () => {
  const { projects } = resolveProjectContext(workspace)
  const lint = deriveLint(projects)
  const overrides = lint.overrides ?? []

  expect(lint.env).toBeUndefined()
  expect(overrides.slice(0, 3)).toStrictEqual([
    expect.objectContaining({
      files: ['apps/web/**'],
      env: { browser: true, vue: true },
      plugins: ['vue']
    }),
    expect.objectContaining({
      files: ['packages/cli/**'],
      env: { node: true },
      plugins: ['node', 'react', 'react-perf']
    }),
    expect.objectContaining({
      files: ['packages/lib/**'],
      env: { node: true }
    })
  ])
  expect(overrides[1]?.rules).toMatchObject({ 'no-console': 'off' })
  expect(overrides[2]?.rules).not.toHaveProperty('no-console')
})

it('should rebase file roles under each project after project traits', () => {
  const { projects } = resolveProjectContext(workspace)
  const files = deriveLint(projects)
    .overrides?.slice(3)
    .map(override => override.files)

  expect(files).toHaveLength(projects.length * 3)
  expect(files).toContainEqual(['./scripts/**', './script/**', './*.ts', './*.js'])
  expect(files).toContainEqual([
    'packages/lib/scripts/**',
    'packages/lib/script/**',
    'packages/lib/*.ts',
    'packages/lib/*.js'
  ])
})

import { join } from 'node:path'

import { expect, it } from 'vite-plus/test'

import { deriveLint } from '../src/preset/lint/index.ts'
import { resolveProjectContext } from '../src/project/index.ts'
import { createTestProject } from './project-fixture.ts'

const workspace = join(import.meta.dirname, 'fixtures/workspace')

const cliProject = createTestProject({ packageBin: true, packageDependencies: ['react'] })

it('should name an object for each trait and role of a single project', () => {
  const lint = deriveLint([cliProject])

  expect(lint.map(item => item.name)).toStrictEqual([
    'liangmi/ignores',
    'liangmi/options',
    'liangmi/correctness',
    'liangmi/perf',
    'liangmi/suspicious',
    'liangmi/nursery',
    'liangmi/restriction',
    'liangmi/pedantic',
    'liangmi/style',
    'liangmi/node',
    'liangmi/cli',
    'liangmi/react',
    'liangmi/test',
    'liangmi/script',
    'liangmi/config-file'
  ])
  expect(lint).toContainEqual(
    expect.objectContaining({
      name: 'liangmi/react',
      rules: expect.objectContaining({ 'react/rules-of-hooks': 'error' })
    })
  )
})

it('should preserve style rules through an allowlist', () => {
  const lint = deriveLint([cliProject])
  const rules = lint.flatMap(item => Object.keys(item.rules ?? {}))

  expect(lint).toContainEqual(
    expect.objectContaining({
      name: 'liangmi/style',
      rules: expect.objectContaining({
        curly: 'warn',
        'typescript/consistent-type-definitions': ['warn', 'interface']
      })
    })
  )
  expect(rules).not.toContain('unicorn/explicit-timer-delay')
})

it('should scope trait objects to each workspace project', () => {
  const { projects } = resolveProjectContext(workspace)
  const lint = deriveLint(projects)
  const findItem = (name: string) => lint.find(item => item.name === name)

  expect(findItem('liangmi/apps/web/vue')).toMatchObject({
    files: ['apps/web/**'],
    env: { vue: true }
  })
  expect(findItem('liangmi/packages/cli/cli')).toMatchObject({
    files: ['packages/cli/**'],
    rules: { 'no-console': 'off' }
  })
  expect(findItem('liangmi/packages/lib/cli')).toBeUndefined()
})

it('should rebase file roles under each project after project traits', () => {
  const { projects } = resolveProjectContext(workspace)
  const lint = deriveLint(projects)
  const firstRole = lint.findIndex(item => item.name === 'liangmi/test')
  const roles = lint.slice(firstRole)

  expect(roles).toHaveLength(projects.length * 3)
  expect(roles.map(item => item.files)).toContainEqual([
    'packages/lib/scripts/**',
    'packages/lib/script/**',
    'packages/lib/*.ts',
    'packages/lib/*.js'
  ])
})

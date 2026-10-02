import { join } from 'node:path'

import { expect, it } from 'vite-plus/test'

import { resolveProjectContext } from '../src/project/index.ts'

const workspace = join(import.meta.dirname, 'fixtures/workspace')

it('should detect every workspace project from the root', () => {
  const { position, projects } = resolveProjectContext(workspace)

  expect(position).toBe('root')
  expect(projects.map(project => project.path)).toStrictEqual([
    '.',
    'apps/web',
    'packages/cli',
    'packages/lib'
  ])
})

it('should detect project facts from committed files', () => {
  const { projects } = resolveProjectContext(workspace)
  const facts = Object.fromEntries(projects.map(project => [project.path, project.facts]))

  expect(facts).toStrictEqual({
    '.': { runtime: 'universal', frameworks: [], lib: false, cli: false },
    'apps/web': { runtime: 'browser', frameworks: ['vue', 'tailwindcss'], lib: false, cli: false },
    'packages/cli': { runtime: 'node', frameworks: ['react'], lib: false, cli: true },
    'packages/lib': { runtime: 'node', frameworks: ['react'], lib: true, cli: false }
  })
})

it('should scope the root project outside members', () => {
  const { projects } = resolveProjectContext(workspace)

  expect(projects[0]?.scope).toStrictEqual({
    files: ['**'],
    excludeFiles: ['apps/web/**', 'packages/cli/**', 'packages/lib/**']
  })
  expect(projects[1]?.scope).toStrictEqual({ files: ['apps/web/**'] })
})

it('should add and override projects with declared facts', () => {
  const { projects } = resolveProjectContext(workspace, {
    tools: { runtime: 'node' },
    'apps/web': { runtime: 'universal' }
  })

  expect(projects.find(project => project.path === 'tools')?.facts.runtime).toBe('node')
  expect(projects.find(project => project.path === 'apps/web')?.facts).toMatchObject({
    runtime: 'universal',
    frameworks: ['vue', 'tailwindcss']
  })
})

it('should resolve a member with its own facts only', () => {
  const { position, projects } = resolveProjectContext(join(workspace, 'packages/cli'), {
    '.': { lib: true }
  })

  expect(position).toBe('member')
  expect(projects).toStrictEqual([
    {
      path: 'packages/cli',
      scope: { files: ['packages/cli/**'] },
      facts: { runtime: 'node', frameworks: ['react'], lib: true, cli: true }
    }
  ])
})

it('should treat a workspace without members as a single project', () => {
  const { position, projects } = resolveProjectContext(join(workspace, '../../..'))

  expect(position).toBe('root')
  expect(projects).toHaveLength(1)
  expect(projects[0]?.facts).toStrictEqual({
    runtime: 'node',
    frameworks: [],
    lib: true,
    cli: false
  })
})

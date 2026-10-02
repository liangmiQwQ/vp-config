import { join } from 'node:path'

import { expect, it } from 'vite-plus/test'

import { resolveProjectContext } from '../src/project/index.ts'
import type { Project } from '../src/project/index.ts'
import { getRuntime, isCli, isLib, isReact, isTailwindcss, isVue } from '../src/project/traits.ts'

const workspace = join(import.meta.dirname, 'fixtures/workspace')

function deriveTraits(project: Project): Record<string, unknown> {
  return {
    runtime: getRuntime(project),
    lib: isLib(project),
    cli: isCli(project),
    react: isReact(project),
    vue: isVue(project),
    tailwindcss: isTailwindcss(project)
  }
}

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

it('should detect raw project facts from committed files', () => {
  const { projects } = resolveProjectContext(workspace)

  expect(projects.find(project => project.path === 'packages/lib')?.facts).toStrictEqual({
    packageDependencies: ['react'],
    packageExports: true,
    packageBin: false,
    tsconfigLib: [],
    tsconfigTypes: ['node'],
    indexHtml: false
  })
})

it('should derive project traits from facts', () => {
  const { projects } = resolveProjectContext(workspace)
  const traits = Object.fromEntries(projects.map(project => [project.path, deriveTraits(project)]))
  const none = { lib: false, cli: false, react: false, vue: false, tailwindcss: false }

  expect(traits).toStrictEqual({
    '.': { ...none, runtime: 'universal' },
    'apps/web': { ...none, runtime: 'browser', vue: true, tailwindcss: true },
    'packages/cli': { ...none, runtime: 'node', cli: true, react: true },
    'packages/lib': { ...none, runtime: 'node', lib: true, react: true }
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

it('should add and override projects with declared traits', () => {
  const { projects } = resolveProjectContext(workspace, {
    tools: { runtime: 'node' },
    'apps/web': { runtime: 'universal', react: true }
  })
  const findProject = (path: string): Project => projects.find(project => project.path === path)!

  expect(getRuntime(findProject('tools'))).toBe('node')
  expect(deriveTraits(findProject('apps/web'))).toMatchObject({
    runtime: 'universal',
    react: true,
    vue: true
  })
})

it('should resolve a member with its own traits only', () => {
  const { position, projects } = resolveProjectContext(join(workspace, 'packages/cli'), {
    '.': { lib: true }
  })
  const [project] = projects

  expect(position).toBe('member')
  expect(projects).toHaveLength(1)
  expect(project).toMatchObject({
    path: 'packages/cli',
    scope: { files: ['packages/cli/**'] },
    declared: { lib: true }
  })
  expect(deriveTraits(project)).toMatchObject({ runtime: 'node', lib: true, cli: true })
})

it('should treat a workspace without members as a single project', () => {
  const { position, projects } = resolveProjectContext(join(workspace, '../../..'))

  expect(position).toBe('root')
  expect(projects).toHaveLength(1)
  expect(deriveTraits(projects[0])).toStrictEqual({
    runtime: 'node',
    lib: true,
    cli: false,
    react: false,
    vue: false,
    tailwindcss: false
  })
})

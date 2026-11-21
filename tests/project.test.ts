import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, it } from 'vite-plus/test'

import { resolveProjectContext } from '../src/project/index.ts'
import type { Project } from '../src/project/index.ts'
import {
  isBrowser,
  isCli,
  isLib,
  isNode,
  isReact,
  isReactCompiler,
  isTailwindcss,
  isVue
} from '../src/project/traits.ts'

const workspace = join(import.meta.dirname, 'fixtures/workspace')

function deriveTraits(project: Project): Record<string, unknown> {
  return {
    node: isNode(project),
    browser: isBrowser(project),
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
    packageDependencies: ['babel-plugin-react-compiler', 'react'],
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
  const none = {
    node: false,
    browser: false,
    lib: false,
    cli: false,
    react: false,
    vue: false,
    tailwindcss: false
  }

  expect(traits).toStrictEqual({
    '.': none,
    'apps/web': { ...none, browser: true, vue: true, tailwindcss: true },
    'packages/cli': { ...none, node: true, cli: true, react: true },
    'packages/lib': { ...none, node: true, lib: true, react: true }
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
  const { projects } = resolveProjectContext(workspace, [
    { path: 'tools', node: true },
    { path: './apps/web/', node: true },
    { path: 'apps/web', react: true }
  ])
  const findProject = (path: string): Project => projects.find(project => project.path === path)!

  expect(isNode(findProject('tools'))).toBe(true)
  expect(deriveTraits(findProject('apps/web'))).toMatchObject({
    node: true,
    browser: true,
    react: true,
    vue: true
  })
})

it('should resolve a member with its own traits only', () => {
  const { position, projects } = resolveProjectContext(join(workspace, 'packages/cli'), [
    { path: 'packages/cli', lib: true }
  ])
  const [project] = projects

  expect(position).toBe('member')
  expect(projects).toHaveLength(1)
  expect(project).toMatchObject({
    path: 'packages/cli',
    scope: { files: ['packages/cli/**'] },
    declared: { lib: true }
  })
  expect(deriveTraits(project)).toMatchObject({ node: true, lib: true, cli: true })
})

it('should treat a workspace without members as a single project', () => {
  const { position, projects } = resolveProjectContext(join(workspace, '../../..'))

  expect(position).toBe('root')
  expect(projects).toHaveLength(1)
  expect(deriveTraits(projects[0])).toStrictEqual({
    node: true,
    browser: false,
    lib: true,
    cli: false,
    react: false,
    vue: false,
    tailwindcss: false
  })
})

it.each([
  ['@vitejs/plugin-react-swc', '{ compiler: true }', true],
  ['@vitejs/plugin-react-swc', '', false],
  ['@vitejs/plugin-react', "{ compiler: { target: '18' } }", true],
  ['@vitejs/plugin-react', '{ compiler: false }', false],
  ['oxc-transform-react', '', true],
  ['swc-plugin-react-compiler', '', true]
] as const)('should detect %s with options %s', async (dependency, options, expected) => {
  const root = await mkdtemp(join(tmpdir(), 'vp-react-'))
  try {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ devDependencies: { react: '*', [dependency]: '*' } })
    )
    if (dependency.startsWith('@vitejs/')) {
      await writeFile(
        join(root, 'vite.config.ts'),
        `import plugin from '${dependency}'; export default { plugins: [plugin(${options})] }`
      )
    }
    const { projects } = resolveProjectContext(root)
    expect(isReactCompiler(projects[0])).toBe(expected)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

it.each([
  ['[react()]', 'oxc-transform-react', false],
  ['[react({ compiler: false })]', 'oxc-transform-react', false],
  ['[react(), ...lazyPlugins()]', 'oxc-transform-react', true],
  ['lazyPlugins()', 'oxc-transform-react', true],
  ['lazyPlugins()', 'react', false],
  ['[react({ compiler: false, ...options })]', 'oxc-transform-react', true],
  ['[react({ ...options, compiler: false })]', 'oxc-transform-react', false],
  ['[react(), babel({ presets: [compilerPreset()] })]', 'react', true],
  ["[react({ babel: { plugins: [['babel-plugin-react-compiler', {}]] } })]", 'react', true],
  ['[react()]', 'babel-plugin-react-compiler', true]
] as const)('should resolve %s with dependency %s', async (plugins, dependency, expected) => {
  const root = await mkdtemp(join(tmpdir(), 'vp-react-'))
  try {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ devDependencies: { [dependency]: '*' } })
    )
    await writeFile(
      join(root, 'vite.config.ts'),
      [
        "import react, { reactCompilerPreset as compilerPreset } from '@vitejs/plugin-react'",
        "import babel from '@rolldown/plugin-babel'",
        `export default { plugins: ${plugins} }`
      ].join('\n')
    )
    expect(isReactCompiler(resolveProjectContext(root).projects[0])).toBe(expected)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

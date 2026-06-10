import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vite-plus/test'

import { isWorkspace as isWorkspaceRoot } from '../src/utils.ts'

test('returns undefined outside a monorepo', () => {
  withTempCwd(project => {
    writeJson(join(project, 'package.json'), { name: 'single-package' })

    expect(isWorkspaceRoot()).toBeUndefined()
  })
})

test('returns true for a pnpm workspace root', () => {
  withTempCwd(project => {
    writeJson(join(project, 'package.json'), { name: 'root' })
    writeFileSync(join(project, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
    createPackage(project, 'packages/lib')

    expect(isWorkspaceRoot()).toBe(true)
  })
})

test('returns false for a pnpm workspace package', () => {
  withTempCwd(project => {
    writeJson(join(project, 'package.json'), { name: 'root' })
    writeFileSync(join(project, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
    const packageDir = createPackage(project, 'packages/lib')

    process.chdir(packageDir)

    expect(isWorkspaceRoot()).toBe(false)
  })
})

test('reads package.json workspaces array', () => {
  withTempCwd(project => {
    writeJson(join(project, 'package.json'), {
      name: 'root',
      workspaces: ['apps/*']
    })
    const packageDir = createPackage(project, 'apps/web')

    process.chdir(packageDir)

    expect(isWorkspaceRoot()).toBe(false)
  })
})

test('reads package.json workspaces packages object', () => {
  withTempCwd(project => {
    writeJson(join(project, 'package.json'), {
      name: 'root',
      workspaces: {
        packages: ['packages/*']
      }
    })
    const packageDir = createPackage(project, 'packages/lib')

    process.chdir(packageDir)

    expect(isWorkspaceRoot()).toBe(false)
  })
})

test('honors negated workspace patterns', () => {
  withTempCwd(project => {
    writeJson(join(project, 'package.json'), { name: 'root' })
    writeFileSync(
      join(project, 'pnpm-workspace.yaml'),
      "packages:\n  - 'packages/*'\n  - '!packages/fixture'\n"
    )
    const packageDir = createPackage(project, 'packages/fixture')

    process.chdir(packageDir)

    expect(isWorkspaceRoot()).toBe(true)
  })
})

function withTempCwd(run: (project: string) => void): void {
  const previousCwd = process.cwd()
  const project = mkdtempSync(join(tmpdir(), 'vp-config-'))

  try {
    process.chdir(project)
    run(project)
  } finally {
    process.chdir(previousCwd)
    rmSync(project, { recursive: true, force: true })
  }
}

function createPackage(root: string, path: string): string {
  const directory = join(root, path)
  mkdirSync(directory, { recursive: true })
  writeJson(join(directory, 'package.json'), { name: path.replaceAll('/', '-') })

  return directory
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

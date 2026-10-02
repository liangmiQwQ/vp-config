// Finds the workspace root, and lists its members from `pnpm-workspace.yaml` or `package.json` workspaces.

// oxlint-disable node/no-sync -- Config files are read once while Vite+ loads vite.config.ts.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'

import { globSync } from 'tinyglobby'
import { parse } from 'yaml'

import { readPackageJson } from './facts/manifest.ts'

// Walk up until a pnpm workspace file or a package.json with `workspaces` is found.
export function findWorkspaceRoot(directory: string): string | undefined {
  if (readWorkspacePatterns(directory)) {
    return directory
  }

  const parent = dirname(directory)

  return parent === directory ? undefined : findWorkspaceRoot(parent)
}

// Member paths are POSIX paths relative to the workspace root.
export function listWorkspaceMembers(root: string): string[] {
  const patterns = readWorkspacePatterns(root) ?? []
  const manifests = globSync(patterns.map(toManifestPattern), {
    cwd: root,
    ignore: ['**/node_modules/**']
  })

  return manifests
    .map(manifest => posix.dirname(manifest))
    .filter(member => member !== '.')
    .toSorted()
}

function readWorkspacePatterns(directory: string): string[] | undefined {
  const pnpmWorkspace = join(directory, 'pnpm-workspace.yaml')

  if (existsSync(pnpmWorkspace)) {
    const config = parse(readFileSync(pnpmWorkspace, 'utf8')) as { packages?: string[] } | null

    return config?.packages ?? []
  }

  const { workspaces } = readPackageJson(directory) ?? {}

  return Array.isArray(workspaces) ? workspaces : workspaces?.packages
}

function toManifestPattern(pattern: string): string {
  const path = pattern.replace(/\/+$/u, '')

  return `${path}/package.json`
}

// oxlint-disable node/no-sync -- Config files are read once while Vite+ loads vite.config.ts.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface PackageJson {
  bin?: unknown
  exports?: unknown
  workspaces?: string[] | { packages?: string[] }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export function readPackageJson(directory: string): PackageJson | undefined {
  const path = join(directory, 'package.json')

  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as PackageJson) : undefined
}

export function listDependencies(packageJson: PackageJson | undefined): string[] {
  return [
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.peerDependencies ?? {})
  ]
}

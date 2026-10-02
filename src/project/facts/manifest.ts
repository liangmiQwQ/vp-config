// Reads `package.json`, and extracts the raw facts of a project from it.

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
  optionalDependencies?: Record<string, string>
}

export interface ManifestFacts {
  // Names of every dependency, including dev, peer and optional ones.
  packageDependencies: string[]
  packageExports: boolean
  packageBin: boolean
}

export function readPackageJson(directory: string): PackageJson | undefined {
  const path = join(directory, 'package.json')

  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as PackageJson) : undefined
}

export function detectManifestFacts(directory: string): ManifestFacts {
  const packageJson = readPackageJson(directory)

  return {
    packageDependencies: listDependencies(packageJson),
    packageExports: packageJson?.exports !== undefined,
    packageBin: packageJson?.bin !== undefined
  }
}

function listDependencies(packageJson: PackageJson | undefined): string[] {
  return [
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.peerDependencies ?? {}),
    ...Object.keys(packageJson?.optionalDependencies ?? {})
  ]
}

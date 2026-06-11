import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

import { globSync } from 'tinyglobby'
import { parse } from 'yaml'

/**
 * Check whether a config is a root-level workspace config.
 *
 * It returns `undefined` if it is not a monorepo, return `true` for monorepo's root config, return `false` for nested config.
 */
export function isWorkspace(): boolean | undefined {
  // 1. Find the nearest workspace marker.
  const cwd = resolve(process.cwd())
  let workspaceRoot: string | undefined
  let workspacePatterns: string[] = []

  for (let directory = cwd; ; directory = dirname(directory)) {
    const pnpmWorkspacePath = join(directory, 'pnpm-workspace.yaml')
    if (existsSync(pnpmWorkspacePath)) {
      const workspaceConfig = parse(readFileSync(pnpmWorkspacePath, 'utf8')) as {
        packages?: unknown
      }

      workspaceRoot = directory
      workspacePatterns = Array.isArray(workspaceConfig.packages)
        ? workspaceConfig.packages.filter(pattern => typeof pattern === 'string')
        : []
      break
    }

    const packageJsonPath = join(directory, 'package.json')
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
        workspaces?: string[] | { packages?: string[] }
      }
      const patterns = Array.isArray(packageJson.workspaces)
        ? packageJson.workspaces
        : packageJson.workspaces?.packages

      if (patterns) {
        workspaceRoot = directory
        workspacePatterns = patterns
        break
      }
    }

    const parent = dirname(directory)
    if (parent === directory) {
      break
    }
  }

  if (!workspaceRoot) {
    return undefined
  }

  // 2. A config loaded from the workspace root is the shared config.
  if (relative(cwd, workspaceRoot) === '') {
    return true
  }

  // 3. Expand workspace patterns by scanning package.json files.
  const packageDirs = globSync(
    workspacePatterns
      .filter(pattern => !pattern.startsWith('!'))
      .map(pattern => `${pattern}/package.json`),
    {
      absolute: true,
      cwd: workspaceRoot,
      ignore: [
        '**/node_modules/**',
        ...workspacePatterns
          .filter(pattern => pattern.startsWith('!'))
          .map(pattern => `${pattern.slice(1)}/package.json`)
      ]
    }
  )
    .map(packageJsonPath => dirname(packageJsonPath))
    .sort((left, right) => right.length - left.length)

  // 4. Treat unmatched excluded packages as root-level config locations.
  const currentPackage = packageDirs.find(packageDir => {
    const relativePath = relative(packageDir, cwd)

    return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith('/'))
  })

  return currentPackage ? relative(currentPackage, workspaceRoot) === '' : true
}

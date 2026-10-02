// oxlint-disable node/no-sync -- Config files are read once while Vite+ loads vite.config.ts.
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { parseTsconfig } from 'get-tsconfig'

import { listDependencies, readPackageJson } from './manifest.ts'
import type { PackageJson } from './manifest.ts'

export type Runtime = 'node' | 'browser' | 'universal'
export type Framework = 'react' | 'vue' | 'ink' | 'tailwindcss'

export interface ProjectFacts {
  runtime: Runtime
  frameworks: Framework[]
  lib: boolean
  cli: boolean
}

const frameworks: Framework[] = ['react', 'vue', 'ink', 'tailwindcss']

// Facts are detected from committed files, so the root config can read them without executing member configs.
export function detectFacts(directory: string): ProjectFacts {
  const packageJson = readPackageJson(directory)

  return {
    runtime: detectRuntime(directory, packageJson),
    frameworks: detectFrameworks(packageJson),
    lib: packageJson?.exports !== undefined,
    cli: packageJson?.bin !== undefined
  }
}

function detectFrameworks(packageJson: PackageJson | undefined): Framework[] {
  const dependencies = new Set(listDependencies(packageJson))

  return frameworks.filter(framework => dependencies.has(framework))
}

// Conflicting signals mean the code runs in both environments.
function detectRuntime(directory: string, packageJson: PackageJson | undefined): Runtime {
  const runtimes = new Set<Runtime>(detectTsconfigRuntimes(directory))

  if (packageJson?.bin !== undefined) {
    runtimes.add('node')
  }

  if (existsSync(join(directory, 'index.html'))) {
    runtimes.add('browser')
  }

  const [runtime] = runtimes

  return runtimes.size === 1 ? runtime : 'universal'
}

function detectTsconfigRuntimes(directory: string): Runtime[] {
  const path = join(directory, 'tsconfig.json')

  if (!existsSync(path)) {
    return []
  }

  const { compilerOptions } = parseTsconfig(path)
  const libs = (compilerOptions?.lib ?? []).map(lib => lib.toLowerCase())
  const types = compilerOptions?.types ?? []

  return [
    ...(libs.some(lib => lib.startsWith('dom')) ? ['browser' as const] : []),
    ...(types.includes('node') ? ['node' as const] : [])
  ]
}

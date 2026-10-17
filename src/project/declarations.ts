// Read workspace declarations without invoking the root's environment-dependent config function.

import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { runnerImport } from 'vite-plus'

import type { DeclaredProject } from './index.ts'

// Config loaders may instantiate another copy of this package, so metadata needs a shared key.
export const declarationKey = Symbol.for('@liangmi/vp-config/declarations')

const configNames = [
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
  'vite.config.cjs',
  'vite.config.mts',
  'vite.config.cts'
]

export async function loadRootDeclarations(root: string): Promise<DeclaredProject[]> {
  const path = configNames.map(name => join(root, name)).find(existsSync)
  if (!path) {
    return []
  }

  const { module } = await runnerImport<{ default: unknown }>(path, { root })
  // Direct builders expose declarations before resolution; promises and top-level await retain them too.
  return readDeclarations(module.default) ?? readDeclarations(await module.default) ?? []
}

function readDeclarations(config: unknown): DeclaredProject[] | undefined {
  if (config === null || (typeof config !== 'object' && typeof config !== 'function')) {
    return undefined
  }

  return (config as { [declarationKey]?: DeclaredProject[] })[declarationKey]
}

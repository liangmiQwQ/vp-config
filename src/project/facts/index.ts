// oxlint-disable node/no-sync -- Config files are read once while Vite+ loads vite.config.ts.
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { detectManifestFacts } from './manifest.ts'
import type { ManifestFacts } from './manifest.ts'
import { detectTsconfigFacts } from './tsconfig.ts'
import type { TsconfigFacts } from './tsconfig.ts'

// Facts are raw data read from committed files, so the root config can read them without executing member configs.
export interface ProjectFacts extends ManifestFacts, TsconfigFacts {
  indexHtml: boolean
}

export function detectFacts(directory: string): ProjectFacts {
  return {
    ...detectManifestFacts(directory),
    ...detectTsconfigFacts(directory),
    indexHtml: existsSync(join(directory, 'index.html'))
  }
}

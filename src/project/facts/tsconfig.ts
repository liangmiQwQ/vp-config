// oxlint-disable node/no-sync -- Config files are read once while Vite+ loads vite.config.ts.
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { parseTsconfig } from 'get-tsconfig'

export interface TsconfigFacts {
  // `compilerOptions.lib`, lowercased since TypeScript treats it case-insensitively.
  tsconfigLib: string[]
  // `compilerOptions.types`.
  tsconfigTypes: string[]
}

export function detectTsconfigFacts(directory: string): TsconfigFacts {
  const path = join(directory, 'tsconfig.json')
  const { compilerOptions } = existsSync(path) ? parseTsconfig(path) : {}

  return {
    tsconfigLib: (compilerOptions?.lib ?? []).map(lib => lib.toLowerCase()),
    tsconfigTypes: compilerOptions?.types ?? []
  }
}

import type { UserConfig } from 'vite-plus'

import type { ProjectFacts } from '../project/index.ts'
import { listDependencies, readPackageJson } from '../project/manifest.ts'

type TestConfig = NonNullable<UserConfig['test']>

// Browser-like environments need their own package, so only use the one the project installs.
const domEnvironments = ['happy-dom', 'jsdom'] as const

export function deriveTest(facts: ProjectFacts, directory: string): TestConfig | undefined {
  if (facts.runtime === 'node') {
    return { environment: 'node' }
  }

  if (facts.runtime !== 'browser') {
    return undefined
  }

  const dependencies = new Set(listDependencies(readPackageJson(directory)))
  const environment = domEnvironments.find(name => dependencies.has(name))

  return environment ? { environment } : undefined
}

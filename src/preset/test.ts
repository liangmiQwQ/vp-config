import type { UserConfig } from 'vite-plus'

import type { Project } from '../project/index.ts'
import { getRuntime, hasDependency } from '../project/traits.ts'

type TestConfig = NonNullable<UserConfig['test']>

// Browser-like environments need their own package, so only use the one the project installs.
const domEnvironments = ['happy-dom', 'jsdom'] as const

export function deriveTest(project: Project): TestConfig | undefined {
  const runtime = getRuntime(project)

  if (runtime === 'node') {
    return { environment: 'node' }
  }

  if (runtime !== 'browser') {
    return undefined
  }

  const environment = domEnvironments.find(name => hasDependency(project.facts, name))

  return environment ? { environment } : undefined
}

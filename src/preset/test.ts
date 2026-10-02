// Vitest preset derived from the `node` and `browser` traits of a project.

import type { UserConfig } from 'vite-plus'

import type { Project } from '../project/index.ts'
import { hasDependency, isBrowser, isNode } from '../project/traits.ts'

type TestConfig = NonNullable<UserConfig['test']>

// Browser-like environments need their own package, so only use the one the project installs.
const domEnvironments = ['happy-dom', 'jsdom'] as const

// A universal project prefers the browser environment, since installing one of them signals the intent.
export function deriveTest(project: Project): TestConfig | undefined {
  const environment = isBrowser(project)
    ? domEnvironments.find(name => hasDependency(project.facts, name))
    : undefined

  if (environment) {
    return { environment }
  }

  return isNode(project) ? { environment: 'node' } : undefined
}

import type { ProjectFacts } from './facts/index.ts'

export type Runtime = 'node' | 'browser' | 'universal'

// Traits are derived from facts, and can be declared when the derivation is wrong.
export interface ProjectTraits {
  runtime: Runtime
  lib: boolean
  cli: boolean
  react: boolean
  vue: boolean
  tailwindcss: boolean
}

export interface TraitSource {
  facts: ProjectFacts
  declared: Partial<ProjectTraits>
}

// Conflicting signals mean the code runs in both environments.
export function getRuntime({ facts, declared }: TraitSource): Runtime {
  if (declared.runtime) {
    return declared.runtime
  }

  const runtimes = new Set<Runtime>([
    ...(facts.tsconfigLib.some(lib => lib.startsWith('dom')) ? ['browser' as const] : []),
    ...(facts.indexHtml ? ['browser' as const] : []),
    ...(facts.tsconfigTypes.includes('node') ? ['node' as const] : []),
    ...(facts.packageBin ? ['node' as const] : [])
  ])
  const [runtime] = runtimes

  return runtimes.size === 1 ? runtime : 'universal'
}

export function isLib({ facts, declared }: TraitSource): boolean {
  return declared.lib ?? facts.packageExports
}

export function isCli({ facts, declared }: TraitSource): boolean {
  return declared.cli ?? facts.packageBin
}

export function isReact({ facts, declared }: TraitSource): boolean {
  return declared.react ?? hasDependency(facts, 'react')
}

export function isVue({ facts, declared }: TraitSource): boolean {
  return declared.vue ?? hasDependency(facts, 'vue')
}

export function isTailwindcss({ facts, declared }: TraitSource): boolean {
  return declared.tailwindcss ?? hasDependency(facts, 'tailwindcss')
}

export function hasDependency(facts: ProjectFacts, name: string): boolean {
  return facts.packageDependencies.includes(name)
}

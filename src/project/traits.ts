// Interprets project facts into traits, which declared traits take precedence over.

import type { ProjectFacts } from './facts/index.ts'

// Traits are derived from facts, and can be declared when the derivation is wrong.
export interface ProjectTraits {
  node: boolean
  browser: boolean
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

// `node` and `browser` are independent, so a universal project has both of them.
export function isNode({ facts, declared }: TraitSource): boolean {
  return declared.node ?? (facts.tsconfigTypes.includes('node') || facts.packageBin)
}

export function isBrowser({ facts, declared }: TraitSource): boolean {
  return (
    declared.browser ?? (facts.tsconfigLib.some(lib => lib.startsWith('dom')) || facts.indexHtml)
  )
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

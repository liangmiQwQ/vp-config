import { mergeConfig } from 'vite-plus'
import type { OxlintConfig, OxlintOverride } from 'vite-plus/lint'

import type { Project } from '../../project/index.ts'
import { lintBase } from './base.ts'
import { lintFacts } from './facts.ts'
import { lintRoles } from './roles.ts'

// The overrides are ordered as: project facts, then file roles. User overrides are appended when merging.
export function deriveLint(projects: Project[]): OxlintConfig {
  const [onlyProject] = projects

  if (projects.length === 1) {
    return {
      ...mergeConfig<OxlintConfig, OxlintConfig>(lintBase, lintFacts(onlyProject.facts)),
      overrides: lintRoles(onlyProject.path)
    }
  }

  return {
    ...lintBase,
    overrides: [
      ...projects.flatMap(projectOverride),
      ...projects.flatMap(project => lintRoles(project.path))
    ]
  }
}

function projectOverride(project: Project): OxlintOverride[] {
  const config = lintFacts(project.facts)

  return Object.keys(config).length > 0 ? [{ ...config, ...project.scope }] : []
}

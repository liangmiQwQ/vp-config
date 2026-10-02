import { mergeConfig } from 'vite-plus'
import type { OxlintConfig, OxlintOverride } from 'vite-plus/lint'

import type { Project } from '../../project/index.ts'
import { lintBase } from './base.ts'
import { lintRoles } from './roles.ts'
import { lintTraits } from './traits.ts'

// The overrides are ordered as: project traits, then file roles. User overrides are appended when merging.
export function deriveLint(projects: Project[]): OxlintConfig {
  const [onlyProject] = projects

  if (projects.length === 1) {
    return {
      ...mergeConfig<OxlintConfig, OxlintConfig>(lintBase, lintTraits(onlyProject)),
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
  const config = lintTraits(project)

  return Object.keys(config).length > 0 ? [{ ...config, ...project.scope }] : []
}

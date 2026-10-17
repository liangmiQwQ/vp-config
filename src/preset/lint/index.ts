// Oxlint preset: combines the base rules, trait overrides and file role overrides of the visible projects.

import type { FlatConfigItem } from 'oxlint-flat-config/vite-plus'

import type { Project } from '../../project/index.ts'
import { lintBase } from './base.ts'
import { lintRoles } from './roles.ts'
import { lintTraits } from './traits.ts'

// Flat config applies in order: base, project traits, then file roles. User config objects are appended when merging.
export function deriveLint(projects: Project[]): FlatConfigItem[] {
  return [
    ...lintBase,
    ...projects.flatMap(lintTraits),
    ...projects.flatMap(project => lintRoles(project.path))
  ]
}

import type { Project, ProjectFacts, ProjectTraits } from '../src/project/index.ts'

const emptyFacts: ProjectFacts = {
  packageDependencies: [],
  packageExports: false,
  packageBin: false,
  tsconfigLib: [],
  tsconfigTypes: [],
  indexHtml: false
}

// A root project in a single-package repo, described by the given facts and declared traits.
export function createTestProject(
  facts: Partial<ProjectFacts>,
  declared: Partial<ProjectTraits> = {}
): Project {
  return { path: '.', scope: { files: ['**'] }, facts: { ...emptyFacts, ...facts }, declared }
}

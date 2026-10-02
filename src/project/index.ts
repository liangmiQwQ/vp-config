// Resolves the projects visible from a config directory, with their scopes, facts and declared traits.

import { join, relative, resolve, sep } from 'node:path'

import { detectFacts } from './facts/index.ts'
import type { ProjectFacts } from './facts/index.ts'
import type { ProjectTraits } from './traits.ts'
import { findWorkspaceRoot, listWorkspaceMembers } from './workspace.ts'

export type { ProjectFacts } from './facts/index.ts'
export type { ProjectTraits } from './traits.ts'

// Project traits declared in config, for the project at `path` relative to the workspace root.
export interface DeclaredProject extends Partial<ProjectTraits> {
  path: string
}

type DeclaredTraits = Record<string, Partial<ProjectTraits>>

export interface Project {
  // POSIX path relative to the workspace root, `.` for the root project.
  path: string
  // Globs relative to the workspace root covering the files owned by this project.
  scope: ProjectScope
  facts: ProjectFacts
  // Traits which override the ones derived from facts.
  declared: Partial<ProjectTraits>
}

export interface ProjectScope {
  files: string[]
  excludeFiles?: string[]
}

export interface ProjectContext {
  position: 'root' | 'member'
  // Projects visible from this position: every project at the root, or the member itself.
  projects: Project[]
}

export function resolveProjectContext(
  configDirectory: string,
  declared: DeclaredProject[] = []
): ProjectContext {
  const root = findWorkspaceRoot(configDirectory) ?? configDirectory
  const declaredTraits = groupDeclared(root, declared)

  if (resolve(root) !== resolve(configDirectory)) {
    const path = toProjectPath(root, configDirectory)

    return {
      position: 'member',
      projects: [
        createProject(root, path, { files: rebaseGlobs(['**'], path) }, declaredTraits[path])
      ]
    }
  }

  return { position: 'root', projects: listProjects(root, declaredTraits) }
}

function listProjects(root: string, declared: DeclaredTraits): Project[] {
  const paths = [...new Set([...listWorkspaceMembers(root), ...Object.keys(declared)])].filter(
    path => path !== '.'
  )
  // Member files are owned by members, so the root project covers the rest.
  const rootScope = {
    files: ['**'],
    excludeFiles: paths.flatMap(path => rebaseGlobs(['**'], path))
  }

  return [
    createProject(root, '.', rootScope, declared['.']),
    ...paths.map(path =>
      createProject(root, path, { files: rebaseGlobs(['**'], path) }, declared[path])
    )
  ]
}

function createProject(
  root: string,
  path: string,
  scope: ProjectScope,
  declared: Partial<ProjectTraits> = {}
): Project {
  return { path, scope, facts: detectFacts(join(root, path)), declared }
}

// Later declarations of the same project override the earlier ones.
function groupDeclared(root: string, declared: DeclaredProject[]): DeclaredTraits {
  const grouped: DeclaredTraits = {}

  for (const { path, ...traits } of declared) {
    const projectPath = toProjectPath(root, resolve(root, path))

    grouped[projectPath] = { ...grouped[projectPath], ...traits }
  }

  return grouped
}

function toProjectPath(root: string, directory: string): string {
  return relative(root, directory).split(sep).join('/') || '.'
}

// Globs of a project are written relative to the project, and rebased to be relative to the workspace root.
export function rebaseGlobs(globs: string[], projectPath: string): string[] {
  return globs.map(glob => `${projectPath}/${glob}`)
}

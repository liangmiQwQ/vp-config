import { join, relative, resolve, sep } from 'node:path'

import { detectFacts } from './facts.ts'
import type { ProjectFacts } from './facts.ts'
import { rebaseGlobs } from './globs.ts'
import { findWorkspaceRoot, listWorkspaceMembers } from './workspace.ts'

export type { Framework, ProjectFacts, Runtime } from './facts.ts'

// Project facts declared in config, keyed by paths relative to the config directory.
export type DeclaredProjects = Record<string, Partial<ProjectFacts>>

export interface Project {
  // POSIX path relative to the workspace root, `.` for the root project.
  path: string
  // Globs relative to the workspace root covering the files owned by this project.
  scope: ProjectScope
  facts: ProjectFacts
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
  declared: DeclaredProjects = {}
): ProjectContext {
  const root = findWorkspaceRoot(configDirectory) ?? configDirectory
  const declaredFacts = normalizeDeclared(root, configDirectory, declared)

  if (resolve(root) !== resolve(configDirectory)) {
    const path = toProjectPath(root, configDirectory)

    return {
      position: 'member',
      projects: [
        createProject(root, path, { files: rebaseGlobs(['**'], path) }, declaredFacts[path])
      ]
    }
  }

  return { position: 'root', projects: listProjects(root, declaredFacts) }
}

function listProjects(root: string, declared: DeclaredProjects): Project[] {
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
  declared: Partial<ProjectFacts> = {}
): Project {
  return { path, scope, facts: { ...detectFacts(join(root, path)), ...declared } }
}

// Declared paths are relative to the config directory, project paths are relative to the workspace root.
function normalizeDeclared(
  root: string,
  configDirectory: string,
  declared: DeclaredProjects
): DeclaredProjects {
  return Object.fromEntries(
    Object.entries(declared).map(([path, facts]) => [
      toProjectPath(root, resolve(configDirectory, path)),
      facts
    ])
  )
}

function toProjectPath(root: string, directory: string): string {
  return relative(root, directory).split(sep).join('/') || '.'
}

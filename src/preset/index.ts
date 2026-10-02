// Assembles the preset config parts for the position of the config, from the projects it can see.

import type { UserConfig } from 'vite-plus'
import type { PackUserConfig } from 'vite-plus/pack'

import { resolveProjectContext } from '../project/index.ts'
import type { DeclaredProject, Project, ProjectContext } from '../project/index.ts'
import { deriveFmt } from './fmt.ts'
import { deriveLint } from './lint/index.ts'
import { derivePack } from './pack.ts'
import { runBase } from './run.ts'
import { deriveTest } from './test.ts'

const stagedBase: NonNullable<UserConfig['staged']> = {
  '*': 'vp check --fix'
}

export interface PresetConfig {
  fmt?: UserConfig['fmt']
  lint?: UserConfig['lint']
  pack?: PackUserConfig
  run?: UserConfig['run']
  staged?: UserConfig['staged']
  test?: UserConfig['test']
}

export type ConfigPart = keyof PresetConfig

export interface Preset {
  position: ProjectContext['position']
  config: PresetConfig
}

// Only emit the parts Vite+ reads from the position of the config.
export function derivePreset(configDirectory: string, declared?: DeclaredProject[]): Preset {
  const { position, projects } = resolveProjectContext(configDirectory, declared)
  const config = position === 'root' ? rootPreset(projects) : memberPreset(projects)

  return { position, config: removeUndefined(config) }
}

// A single-package repo only has the root project, so it also gets the project parts.
function rootPreset(projects: Project[]): PresetConfig {
  const [onlyProject] = projects
  const workspaceConfig: PresetConfig = {
    fmt: deriveFmt(projects),
    lint: deriveLint(projects),
    run: runBase,
    staged: stagedBase
  }

  return projects.length === 1
    ? { ...workspaceConfig, ...projectPreset(onlyProject) }
    : workspaceConfig
}

function memberPreset(projects: Project[]): PresetConfig {
  const [project] = projects

  return { run: runBase, ...projectPreset(project) }
}

function projectPreset(project: Project): PresetConfig {
  return {
    pack: derivePack(project),
    test: deriveTest(project)
  }
}

function removeUndefined(config: PresetConfig): PresetConfig {
  return Object.fromEntries(Object.entries(config).filter(([, value]) => value !== undefined))
}

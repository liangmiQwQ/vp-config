import { existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

import type { ConfigName } from './constants.ts'
import { projectConfigNames, rootConfigNames, viteConfigNames } from './constants.ts'
import { readRuntimeInfo } from './info.ts'

export function getAllowedConfigNames(filename: string): readonly ConfigName[] {
  if (!isViteConfigFile(filename)) {
    return []
  }

  const info = readRuntimeInfo(dirname(filename))

  return info?.project.isProject || isStaticWebsiteProjectDirectory(dirname(filename))
    ? projectConfigNames
    : rootConfigNames
}

export function isVpConfigImportAllowed(
  filename: string,
  importedNames: readonly string[]
): boolean {
  const allowedNames = getAllowedConfigNames(filename)
  const allowedNameSet = new Set<string>(allowedNames)

  return (
    allowedNames.length > 0 &&
    importedNames.length > 0 &&
    importedNames.every(name => allowedNameSet.has(name))
  )
}

export function isViteConfigFile(filename: string): boolean {
  return viteConfigNames.includes(basename(filename) as (typeof viteConfigNames)[number])
}

export function hasPackageJson(directory: string): boolean {
  return existsSync(join(directory, 'package.json'))
}

function isStaticWebsiteProjectDirectory(directory: string): boolean {
  return existsSync(join(directory, 'index.html'))
}

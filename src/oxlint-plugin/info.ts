import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ConfigName, ProjectConfigName } from './constants.ts'
import {
  configNames,
  infoDirectoryName,
  infoFileName,
  isVpConfigEntrySpecifier,
  viteConfigNames
} from './constants.ts'

export interface VpConfigRuntimeInfo {
  version: 1
  configFile: string
  configDirectory: string
  category?: ConfigName
  configKeys: string[]
  project: {
    hasViteConfigFields: boolean
    hasPack: boolean
    hasPackageBin: boolean
  }
  cleanup: {
    createdNodeModules: boolean
  }
}

export interface RuntimeConfigInput {
  category?: ConfigName
  config: Record<string, unknown>
}

export function getInfoPath(configDirectory: string): string {
  return join(configDirectory, 'node_modules', infoDirectoryName, infoFileName)
}

export function readRuntimeInfo(configDirectory: string): VpConfigRuntimeInfo | undefined {
  const infoPath = getInfoPath(configDirectory)

  if (!existsSync(infoPath)) {
    return undefined
  }

  try {
    return parseRuntimeInfo(JSON.parse(readFileSync(infoPath, 'utf8')))
  } catch {
    return undefined
  }
}

export function writeRuntimeInfo(input: RuntimeConfigInput): void {
  const { stack } = new Error('Find vite config caller')

  if (!shouldWriteRuntimeInfo(stack)) {
    return
  }

  const configFile = findConfigFileFromStack(stack) ?? findCwdConfigFile()

  if (!configFile) {
    return
  }

  writeRuntimeInfoFile(configFile, input)
}

export function ensureRuntimeInfo(configFile: string): VpConfigRuntimeInfo | undefined {
  const configDirectory = dirname(configFile)

  loadRuntimeInfo(configFile)

  return readRuntimeInfo(configDirectory)
}

export function cleanupRuntimeInfo(configDirectory: string): void {
  const info = readRuntimeInfo(configDirectory)
  const nodeModulesDirectory = join(configDirectory, 'node_modules')

  rmSync(getInfoPath(configDirectory), { force: true })
  rmSync(join(nodeModulesDirectory, infoDirectoryName), { recursive: true, force: true })

  if (info?.cleanup.createdNodeModules) {
    rmSync(nodeModulesDirectory, { recursive: true, force: true })
  }
}

export function getConfigDirectory(filename: string): string {
  return dirname(filename)
}

function writeRuntimeInfoFile(configFile: string, input: RuntimeConfigInput): void {
  const configDirectory = dirname(configFile)
  const nodeModulesDirectory = join(configDirectory, 'node_modules')
  const createdNodeModules = !existsSync(nodeModulesDirectory)
  const infoPath = getInfoPath(configDirectory)

  rmSync(infoPath, { force: true })
  mkdirSync(dirname(infoPath), { recursive: true })
  writeFileSync(
    infoPath,
    `${JSON.stringify(createRuntimeInfo(configFile, input, createdNodeModules), null, 2)}\n`
  )
}

function shouldWriteRuntimeInfo(stack: string | undefined): boolean {
  return hasOxlintEntryStack(stack) || hasVitePlusResolveStack(stack)
}

function hasOxlintEntryStack(stack: string | undefined): boolean {
  return Boolean(
    stack &&
    /node_modules[\\/](?:\.pnpm[\\/]oxlint@[^\\/]+[\\/]node_modules[\\/])?oxlint[\\/]dist[\\/]/u.test(
      stack
    )
  )
}

function hasVitePlusResolveStack(stack: string | undefined): boolean {
  return Boolean(
    stack &&
    /node_modules[\\/]vite-plus[\\/]dist[\\/]resolve-vite-config(?:-[^\\/]+)?\.js/u.test(stack)
  )
}

function loadRuntimeInfo(configFile: string): void {
  const input = readRuntimeConfigInput(configFile)

  if (!input) {
    // The rule that needs runtime info will report the missing info.
    return
  }

  writeRuntimeInfoFile(configFile, input)
}

function createRuntimeInfo(
  configFile: string,
  input: RuntimeConfigInput,
  createdNodeModules: boolean
): VpConfigRuntimeInfo {
  const configDirectory = dirname(configFile)
  const configKeys = Object.keys(input.config)
  const hasPack = configKeys.includes('pack')
  const hasViteConfigFields = configKeys.some(isViteConfigField)
  const { hasPackageBin } = readPackageJson(configDirectory)

  return {
    version: 1,
    configFile,
    configDirectory,
    category: input.category,
    configKeys,
    project: {
      hasViteConfigFields,
      hasPack,
      hasPackageBin
    },
    cleanup: {
      createdNodeModules
    }
  }
}

const vitePlusConfigKeys = new Set(['create', 'fmt', 'lint', 'pack', 'run', 'staged', 'test'])

function isViteConfigField(key: string): boolean {
  return !vitePlusConfigKeys.has(key)
}

export function findConfigFileFromStack(stack: string | undefined): string | undefined {
  if (!stack) {
    return undefined
  }

  for (const rawLine of stack.split('\n')) {
    const path = normalizeStackPath(rawLine)
    const configPath = path ? resolveBundledConfigPath(path) : undefined

    if (
      configPath &&
      viteConfigNames.includes(getPathBasename(configPath) as (typeof viteConfigNames)[number])
    ) {
      return configPath
    }
  }

  return undefined
}

function getPathBasename(path: string): string {
  return path.split(/[\\/]/u).at(-1) ?? path
}

function normalizeStackPath(line: string): string | undefined {
  const fileUrlMatch = /file:\/\/\/.*?vite\.config\.[cm]?[jt]s/u.exec(line)

  if (fileUrlMatch) {
    return fileURLToPath(fileUrlMatch[0])
  }

  const absolutePathMatch = /((?:[a-zA-Z]:[\\/]|\/)[^:)]+vite\.config\.[cm]?[jt]s)/u.exec(line)

  return absolutePathMatch ? normalize(absolutePathMatch[1]) : undefined
}

function resolveBundledConfigPath(path: string): string {
  const bundledConfigMatch =
    /^(.*)([\\/])node_modules[\\/]\.vite-temp[\\/](vite\.config\.[cm]?[jt]s)$/u.exec(path)

  return bundledConfigMatch
    ? `${bundledConfigMatch[1]}${bundledConfigMatch[2]}${bundledConfigMatch[3]}`
    : path
}

// Oxlint rule visitors are synchronous, so inspect the supported preset call shape instead of importing vite.config.ts.
function readRuntimeConfigInput(configFile: string): RuntimeConfigInput | undefined {
  try {
    return parseRuntimeConfigInput(readFileSync(configFile, 'utf8'))
  } catch {
    return undefined
  }
}

function parseRuntimeConfigInput(source: string): RuntimeConfigInput | undefined {
  const imports = getConfigImports(source)

  for (const [localName, category] of imports.named) {
    const input = findConfigCallInput(source, localName, category)

    if (input) {
      return input
    }
  }

  for (const namespace of imports.namespaces) {
    for (const category of configNames) {
      const input = findConfigCallInput(source, `${namespace}.${category}`, category)

      if (input) {
        return input
      }
    }
  }

  return undefined
}

function getConfigImports(source: string): {
  named: Map<string, ConfigName>
  namespaces: Set<string>
} {
  const named = new Map<string, ConfigName>()
  const namespaces = new Set<string>()

  for (const match of source.matchAll(
    /import\s*\{(?<imports>[^}]+)\}\s*from\s*['"](?<specifier>[^'"]+)['"]/gu
  )) {
    if (!isConfigEntrySpecifier(match.groups?.specifier)) {
      continue
    }

    for (const specifier of splitSimpleList(match.groups?.imports ?? '')) {
      const [importedName, localName] = specifier.split(/\s+as\s+/u).map(part => part.trim())
      const category = toConfigName(importedName)

      if (category) {
        named.set(localName || importedName, category)
      }
    }
  }

  for (const match of source.matchAll(
    /import\s*\*\s*as\s*(?<localName>[$A-Z_a-z][$\w]*)\s*from\s*['"](?<specifier>[^'"]+)['"]/gu
  )) {
    if (isConfigEntrySpecifier(match.groups?.specifier) && match.groups?.localName) {
      namespaces.add(match.groups.localName)
    }
  }

  for (const match of source.matchAll(
    /const\s*\{(?<imports>[^}]+)\}\s*=\s*require\(\s*['"](?<specifier>[^'"]+)['"]\s*\)/gu
  )) {
    if (!isConfigEntrySpecifier(match.groups?.specifier)) {
      continue
    }

    for (const specifier of splitSimpleList(match.groups?.imports ?? '')) {
      const [importedName, localName] = specifier.split(/\s*:\s*/u).map(part => part.trim())
      const category = toConfigName(importedName)

      if (category) {
        named.set(localName || importedName, category)
      }
    }
  }

  return { named, namespaces }
}

function findConfigCallInput(
  source: string,
  callee: string,
  category: ConfigName
): RuntimeConfigInput | undefined {
  const callPattern = new RegExp(
    `(^|[^$\\w])${callee
      .split('.')
      .map(part => escapeRegExp(part))
      .join(String.raw`\s*\.\s*`)}\\s*(?:\\.\\s*(?<method>only|exclude)\\s*)?\\(`,
    'gu'
  )

  for (const match of source.matchAll(callPattern)) {
    const openParenIndex = match.index + match[0].lastIndexOf('(')
    const argumentIndex = match.groups?.method ? 1 : 0
    const argument = readCallArgument(source, openParenIndex, argumentIndex)
    const configKeys = argument ? readObjectKeys(argument) : []

    if (configKeys.length > 0 || argument?.trim() === '{}') {
      return {
        category,
        config: Object.fromEntries(configKeys.map(key => [key, true]))
      }
    }
  }

  return undefined
}

function readCallArgument(
  source: string,
  openParenIndex: number,
  argumentIndex: number
): string | undefined {
  const closeParenIndex = findClosingDelimiter(source, openParenIndex, '(', ')')

  if (closeParenIndex === undefined) {
    return undefined
  }

  return splitTopLevel(source.slice(openParenIndex + 1, closeParenIndex), ',')[argumentIndex]
}

function readObjectKeys(source: string): string[] {
  const objectStart = source.search(/\S/u)

  if (objectStart === -1 || source[objectStart] !== '{') {
    return []
  }

  const objectEnd = findClosingDelimiter(source, objectStart, '{', '}')

  if (objectEnd === undefined) {
    return []
  }

  return splitTopLevel(source.slice(objectStart + 1, objectEnd), ',').flatMap(readPropertyKey)
}

function readPropertyKey(source: string): string[] {
  const property = source.trim()

  if (!property || property.startsWith('...') || property.startsWith('[')) {
    return []
  }

  const quotedKeyMatch = /^['"](?<key>[^'"]+)['"]\s*[:(]/u.exec(property)

  if (quotedKeyMatch?.groups?.key) {
    return [quotedKeyMatch.groups.key]
  }

  const identifierKeyMatch =
    /^(?:async\s+|get\s+|set\s+)?(?<key>[$A-Z_a-z][$\w]*)\s*(?::|\(|$)/u.exec(property)

  return identifierKeyMatch?.groups?.key ? [identifierKeyMatch.groups.key] : []
}

function splitTopLevel(source: string, separator: string): string[] {
  const parts: string[] = []
  let start = 0
  let depth = 0

  for (let index = 0; index < source.length; index += 1) {
    const skippedIndex = skipSyntax(source, index)

    if (skippedIndex !== index) {
      index = skippedIndex
      continue
    }

    const char = source[index]

    if (char === '(' || char === '[' || char === '{') {
      depth += 1
    } else if (char === ')' || char === ']' || char === '}') {
      depth -= 1
    } else if (char === separator && depth === 0) {
      parts.push(source.slice(start, index).trim())
      start = index + 1
    }
  }

  parts.push(source.slice(start).trim())

  return parts.filter(Boolean)
}

function findClosingDelimiter(
  source: string,
  openIndex: number,
  openDelimiter: string,
  closeDelimiter: string
): number | undefined {
  let depth = 0

  for (let index = openIndex; index < source.length; index += 1) {
    const skippedIndex = skipSyntax(source, index)

    if (skippedIndex !== index) {
      index = skippedIndex
      continue
    }

    if (source[index] === openDelimiter) {
      depth += 1
    } else if (source[index] === closeDelimiter) {
      depth -= 1

      if (depth === 0) {
        return index
      }
    }
  }

  return undefined
}

function skipSyntax(source: string, index: number): number {
  const char = source[index]
  const nextChar = source[index + 1]

  if (char === '"' || char === "'" || char === '`') {
    return skipString(source, index, char)
  }

  if (char === '/' && nextChar === '/') {
    return skipLineComment(source, index)
  }

  if (char === '/' && nextChar === '*') {
    return skipBlockComment(source, index)
  }

  return index
}

function skipString(source: string, start: number, quote: string): number {
  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === '\\') {
      index += 1
    } else if (source[index] === quote) {
      return index
    }
  }

  return source.length - 1
}

function skipLineComment(source: string, start: number): number {
  const end = source.indexOf('\n', start + 2)

  return end === -1 ? source.length - 1 : end
}

function skipBlockComment(source: string, start: number): number {
  const end = source.indexOf('*/', start + 2)

  return end === -1 ? source.length - 1 : end + 1
}

function splitSimpleList(source: string): string[] {
  return source
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
}

function isConfigEntrySpecifier(specifier: string | undefined): boolean {
  return specifier ? isVpConfigEntrySpecifier(specifier) : false
}

function toConfigName(name: string | undefined): ConfigName | undefined {
  return configNames.includes(name as ConfigName) ? (name as ConfigName) : undefined
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`)
}

function readPackageJson(configDirectory: string): { hasPackageBin: boolean } {
  try {
    const packageJson = JSON.parse(readFileSync(join(configDirectory, 'package.json'), 'utf8'))
    const { bin } = packageJson

    return { hasPackageBin: typeof bin === 'string' || isNonEmptyObject(bin) }
  } catch {
    return { hasPackageBin: false }
  }
}

function findCwdConfigFile(): string | undefined {
  for (const configName of viteConfigNames) {
    const configFile = join(process.cwd(), configName)

    if (existsSync(configFile)) {
      return configFile
    }
  }

  return undefined
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.keys(value).length > 0
}

function parseRuntimeInfo(value: unknown): VpConfigRuntimeInfo | undefined {
  if (!isRuntimeInfo(value)) {
    return undefined
  }

  return value
}

function isRuntimeInfo(value: unknown): value is VpConfigRuntimeInfo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === 1 &&
    'project' in value &&
    typeof value.project === 'object' &&
    value.project !== null
  )
}

export function isWebsiteProject(info: VpConfigRuntimeInfo): boolean {
  return existsSync(join(info.configDirectory, 'index.html')) || info.project.hasViteConfigFields
}

export function isLibProject(info: VpConfigRuntimeInfo): boolean {
  return info.project.hasPack
}

export function isCliProject(info: VpConfigRuntimeInfo): boolean {
  return isLibProject(info) && info.project.hasPackageBin
}

export function isProject(info: VpConfigRuntimeInfo): boolean {
  return isWebsiteProject(info) || isLibProject(info)
}

export function inferProjectCategory(info: VpConfigRuntimeInfo): ProjectConfigName | undefined {
  if (isWebsiteProject(info)) {
    return 'website'
  }

  if (isCliProject(info)) {
    return 'cli'
  }

  if (isLibProject(info)) {
    return 'lib'
  }

  return undefined
}

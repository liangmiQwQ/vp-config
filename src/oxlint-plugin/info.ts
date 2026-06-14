import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import type { ConfigName, ProjectConfigName } from './constants.ts'
import { infoDirectoryName, infoFileName, viteConfigNames } from './constants.ts'

export interface VpConfigRuntimeInfo {
  version: 1
  configFile: string
  configDirectory: string
  category?: ConfigName
  configKeys: string[]
  project: {
    hasViteEntry: boolean
    hasViteConfigFields: boolean
    hasPack: boolean
    hasPackageBin: boolean
    isWebsite: boolean
    isLib: boolean
    isCli: boolean
    isProject: boolean
  }
  cleanup: {
    createdNodeModules: boolean
    lspPid?: number
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

  const configDirectory = dirname(configFile)
  const nodeModulesDirectory = join(configDirectory, 'node_modules')
  const createdNodeModules = !existsSync(nodeModulesDirectory)
  const infoPath = getInfoPath(configDirectory)
  const previousInfo = readRuntimeInfo(configDirectory)

  rmSync(infoPath, { force: true })
  mkdirSync(dirname(infoPath), { recursive: true })
  writeFileSync(
    infoPath,
    `${JSON.stringify(createRuntimeInfo(configFile, input, createdNodeModules, previousInfo), null, 2)}\n`
  )
}

export function ensureRuntimeInfo(configFile: string): VpConfigRuntimeInfo | undefined {
  const configDirectory = dirname(configFile)
  const existingInfo = readRuntimeInfo(configDirectory)

  if (existingInfo) {
    return existingInfo
  }

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

export function shouldCleanupRuntimeInfo(
  configDirectory: string,
  argv: readonly string[] = process.argv
): boolean {
  const info = readRuntimeInfo(configDirectory)

  return !isLspProcess(argv) && !isRunningProcess(info?.cleanup.lspPid)
}

export function getConfigDirectory(filename: string): string {
  return dirname(filename)
}

function shouldWriteRuntimeInfo(stack: string | undefined): boolean {
  return Boolean(
    isVpLintOrCheck() || hasOxlintEntryStack(stack) || stack?.includes('resolveUniversalViteConfig')
  )
}

function isVpLintOrCheck(command = process.env.VP_COMMAND): boolean {
  return command === 'lint' || command === 'check'
}

function hasOxlintEntryStack(stack: string | undefined): boolean {
  return Boolean(
    stack &&
    /node_modules[\\/](?:\.pnpm[\\/]oxlint@[^\\/]+[\\/]node_modules[\\/])?oxlint[\\/]dist[\\/]/u.test(
      stack
    )
  )
}

function loadRuntimeInfo(configFile: string): void {
  try {
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `await import(${JSON.stringify(pathToFileURL(configFile).href)})`
      ],
      {
        cwd: dirname(configFile),
        env: {
          ...process.env,
          VP_COMMAND: 'lint',
          VP_OXLINT_LSP: isLspProcess() ? 'true' : undefined
        },
        stdio: 'ignore'
      }
    )
  } catch {
    // The rule that needs runtime info will report the missing info.
  }
}

function createRuntimeInfo(
  configFile: string,
  input: RuntimeConfigInput,
  createdNodeModules: boolean,
  previousInfo: VpConfigRuntimeInfo | undefined
): VpConfigRuntimeInfo {
  const configDirectory = dirname(configFile)
  const configKeys = Object.keys(input.config)
  const hasViteEntry = existsSync(join(configDirectory, 'index.html'))
  const hasPack = configKeys.includes('pack')
  const hasViteConfigFields = configKeys.some(key =>
    key === 'lint' ? false : ['build', 'preview', 'plugins'].includes(key)
  )
  const { hasPackageBin } = readPackageJson(configDirectory)
  const isWebsite = hasViteEntry || hasViteConfigFields
  const isLib = hasPack
  const isCli = isLib && hasPackageBin

  return {
    version: 1,
    configFile,
    configDirectory,
    category: input.category,
    configKeys,
    project: {
      hasViteEntry,
      hasViteConfigFields,
      hasPack,
      hasPackageBin,
      isWebsite,
      isLib,
      isCli,
      isProject: isWebsite || isLib
    },
    cleanup: {
      createdNodeModules,
      lspPid: getRuntimeInfoLspPid(previousInfo)
    }
  }
}

function getRuntimeInfoLspPid(previousInfo: VpConfigRuntimeInfo | undefined): number | undefined {
  if (isLspProcess()) {
    return process.pid
  }

  const previousLspPid = previousInfo?.cleanup.lspPid

  return isRunningProcess(previousLspPid) ? previousLspPid : undefined
}

function isLspProcess(argv: readonly string[] = process.argv): boolean {
  return argv.includes('--lsp') || (argv === process.argv && process.env.VP_OXLINT_LSP === 'true')
}

function isRunningProcess(pid: number | undefined): boolean {
  if (pid === undefined) {
    return false
  }

  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return getErrorCode(error) === 'EPERM'
  }
}

function getErrorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined
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

export function inferProjectCategory(info: VpConfigRuntimeInfo): ProjectConfigName | undefined {
  if (info.project.isWebsite) {
    return 'website'
  }

  if (info.project.isCli) {
    return 'cli'
  }

  if (info.project.isLib) {
    return 'lib'
  }

  return undefined
}

// oxlint-disable node/no-sync -- Config files are read once while Vite+ loads vite.config.ts.
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const configFilePattern = /^vite\.config\.[cm]?[jt]s$/u
// Vite bundles the config into `node_modules/.vite-temp/vite.config.ts.timestamp-<hash>.mjs`.
const bundledConfigPattern = /^(vite\.config\.[cm]?[jt]s)\.timestamp-[\w-]+\.mjs$/u
// Vite bundles the config with an inline source map, which keeps the absolute path of every source.
const sourceMapPattern =
  /\/\/# sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,([\w+/=]+)\s*$/u
const framePattern = /(file:\/\/\/[^\s)]+|(?:[A-Za-z]:)?[\\/][^\s():]+):\d+:\d+/u

// The working directory is not reliable: `vp lint` in a member loads the root config with the member as cwd.
// So find the `vite.config.ts` calling the entry from the stack.
export function findConfigDirectory(stack?: string): string | undefined {
  const configFile = (stack ?? '')
    .split('\n')
    .map(parseFramePath)
    .map(path => (path ? resolveConfigFile(path) : undefined))
    .find(path => path !== undefined)

  return configFile ? dirname(configFile) : undefined
}

function parseFramePath(line: string): string | undefined {
  const [, location] = framePattern.exec(line) ?? []

  if (!location) {
    return undefined
  }

  return location.startsWith('file://') ? fileURLToPath(location) : location
}

function resolveConfigFile(path: string): string | undefined {
  const name = basename(path)

  if (configFilePattern.test(name)) {
    return path
  }

  const [, configName] = bundledConfigPattern.exec(name) ?? []

  return configName ? readBundledConfigFile(path, configName) : undefined
}

// A bundled config may contain several modules, the config itself is the last one with its file name.
function readBundledConfigFile(path: string, configName: string): string | undefined {
  if (!existsSync(path)) {
    return undefined
  }

  const [, sourceMap] = sourceMapPattern.exec(readFileSync(path, 'utf8')) ?? []

  return sourceMap
    ? readSourceMapSources(sourceMap).findLast(source => basename(source) === configName)
    : undefined
}

function readSourceMapSources(sourceMap: string): string[] {
  const { sources } = JSON.parse(Buffer.from(sourceMap, 'base64').toString('utf8')) as {
    sources?: string[]
  }

  return sources ?? []
}

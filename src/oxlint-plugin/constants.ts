export const packageName = '@liangmi/vp-config'
export const pluginName = 'liangmi'
export const infoDirectoryName = '.vp-config'
export const infoFileName = 'info.json'

export const projectConfigNames = ['cli', 'lib', 'website'] as const
export const rootConfigNames = ['base'] as const
export const configNames = [...rootConfigNames, ...projectConfigNames] as const
export const viteConfigNames = [
  'vite.config.ts',
  'vite.config.mts',
  'vite.config.cts',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.cjs'
] as const

export type ConfigName = (typeof configNames)[number]
export type ProjectConfigName = (typeof projectConfigNames)[number]

export function isVpConfigEntrySpecifier(specifier: string): boolean {
  return (
    specifier === packageName ||
    /(?:^|[\\/])src[\\/]index\.ts$/u.test(specifier) ||
    specifier.endsWith('/src/index.ts')
  )
}

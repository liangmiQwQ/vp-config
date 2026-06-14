const pluginFile = import.meta.url.includes('/src/') ? './oxlint-plugin.ts' : './oxlint-plugin.mjs'

export const liangmiOxlintPluginSpecifier = new URL(pluginFile, import.meta.url).href

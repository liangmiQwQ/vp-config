// oxlint-disable node/no-sync -- Read member configs without executing them.
import { readFileSync } from 'node:fs'

import { parseSync, Visitor } from 'vite-plus'
import type { ESTree } from 'vite-plus'

import { findViteConfig } from '../config-file.ts'

type CompilerOption = boolean | 'options' | undefined

// A later spread or computed key can overwrite an earlier literal option.
function option(object: ESTree.ObjectExpression, name: string) {
  for (const field of object.properties.toReversed()) {
    if (field.type === 'SpreadElement' || field.computed) {
      return 'dynamic'
    }
    const key = field.key
    if ((key.type === 'Identifier' ? key.name : key.type === 'Literal' && key.value) === name) {
      return field.value
    }
  }
  return null
}

function usesBabelCompiler(options: ESTree.ObjectExpression, presets: Set<string>): boolean {
  for (const key of ['plugins', 'presets']) {
    const entries = option(options, key)
    if (!entries || entries === 'dynamic' || entries.type !== 'ArrayExpression') {
      continue
    }
    for (const entry of entries.elements) {
      const plugin = entry?.type === 'ArrayExpression' ? entry.elements.at(0) : entry
      if (
        key === 'plugins' &&
        plugin?.type === 'Literal' &&
        plugin.value === 'babel-plugin-react-compiler'
      ) {
        return true
      }
      if (
        key === 'presets' &&
        plugin?.type === 'CallExpression' &&
        plugin.callee.type === 'Identifier' &&
        presets.has(plugin.callee.name)
      ) {
        return true
      }
    }
  }
  return false
}

export function detectViteReactCompiler(directory: string): { viteReactCompiler?: CompilerOption } {
  const path = findViteConfig(directory)
  if (!path) {
    return {}
  }
  const source = readFileSync(path, 'utf8')
  if (!source.includes('@vitejs/plugin-react') && !source.includes('@rolldown/plugin-babel')) {
    return {}
  }

  const { program } = parseSync(path, source)
  const plugins = new Map<string, string>()
  const presets = new Set<string>()
  for (const node of program.body) {
    if (node.type !== 'ImportDeclaration') {
      continue
    }
    const id = node.source.value
    if (
      !['@vitejs/plugin-react', '@vitejs/plugin-react-swc', '@rolldown/plugin-babel'].includes(id)
    ) {
      continue
    }
    for (const specifier of node.specifiers) {
      if (specifier.type === 'ImportDefaultSpecifier') {
        plugins.set(specifier.local.name, id)
      }
      if (
        id === '@vitejs/plugin-react' &&
        specifier.type === 'ImportSpecifier' &&
        specifier.imported.type === 'Identifier' &&
        specifier.imported.name === 'reactCompilerPreset'
      ) {
        presets.add(specifier.local.name)
      }
    }
  }

  function compilerOption(plugin: ESTree.ArrayExpression['elements'][number]): CompilerOption {
    if (plugin?.type !== 'CallExpression' || plugin.callee.type !== 'Identifier') {
      return undefined
    }
    const id = plugins.get(plugin.callee.name)
    if (!id) {
      return undefined
    }
    const options = plugin.arguments.at(0)
    if (!options) {
      return false
    }
    if (options.type !== 'ObjectExpression') {
      return undefined
    }
    if (id === '@rolldown/plugin-babel') {
      return usesBabelCompiler(options, presets) || undefined
    }
    const babel = option(options, 'babel')
    if (
      babel &&
      babel !== 'dynamic' &&
      babel.type === 'ObjectExpression' &&
      usesBabelCompiler(babel, presets)
    ) {
      return true
    }
    const compiler = option(options, 'compiler')
    if (!compiler) {
      return false
    }
    if (compiler === 'dynamic') {
      return undefined
    }
    if (compiler.type === 'ObjectExpression') {
      return 'options'
    }
    return compiler.type === 'Literal' && typeof compiler.value === 'boolean'
      ? compiler.value
      : undefined
  }

  // An opaque sibling (such as lazyPlugins()) may supply another compiler path.
  const settings: CompilerOption[] = []
  new Visitor({
    Property(node) {
      if (
        node.computed ||
        node.key.type !== 'Identifier' ||
        node.key.name !== 'plugins' ||
        node.value.type !== 'ArrayExpression'
      ) {
        return
      }
      const entries = node.value.elements.map(compilerOption)
      if (entries.some(entry => entry !== undefined)) {
        settings.push(...entries)
      }
    }
  }).visit(program)
  const enabled = settings.find(entry => entry === true || entry === 'options')
  if (enabled) {
    return { viteReactCompiler: enabled }
  }
  return settings.length > 0 && settings.every(entry => entry === false)
    ? { viteReactCompiler: false }
    : {}
}

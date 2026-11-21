// oxlint-disable node/no-sync -- Read member configs without executing them.
import { readFileSync } from 'node:fs'

import { parseSync, Visitor } from 'vite-plus'

import { findViteConfig } from '../config-file.ts'

export function detectViteReactCompiler(directory: string): {
  viteReactCompiler?: boolean | 'options'
} {
  const path = findViteConfig(directory)
  if (!path) {
    return {}
  }

  const source = readFileSync(path, 'utf8')
  if (!source.includes('@vitejs/plugin-react')) {
    return {}
  }

  // Resolve the default import so aliases work and unrelated plugins are ignored.
  const { program } = parseSync(path, source)
  const plugins = new Set<string>()
  for (const node of program.body) {
    if (
      node.type !== 'ImportDeclaration' ||
      !['@vitejs/plugin-react', '@vitejs/plugin-react-swc'].includes(node.source.value)
    ) {
      continue
    }
    for (const specifier of node.specifiers) {
      if (specifier.type === 'ImportDefaultSpecifier') {
        plugins.add(specifier.local.name)
      }
    }
  }

  let viteReactCompiler: boolean | 'options' | undefined
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
      for (const plugin of node.value.elements) {
        if (
          plugin?.type !== 'CallExpression' ||
          plugin.callee.type !== 'Identifier' ||
          !plugins.has(plugin.callee.name)
        ) {
          continue
        }
        const options = plugin.arguments.at(0)
        if (options?.type !== 'ObjectExpression') {
          continue
        }
        for (const property of options.properties) {
          if (
            property.type !== 'Property' ||
            property.computed ||
            property.key.type !== 'Identifier' ||
            property.key.name !== 'compiler'
          ) {
            continue
          }
          if (property.value.type === 'Literal' && typeof property.value.value === 'boolean') {
            viteReactCompiler = property.value.value
          }
          if (property.value.type === 'ObjectExpression') {
            viteReactCompiler = 'options'
          }
        }
      }
    }
  }).visit(program)
  return viteReactCompiler === undefined ? {} : { viteReactCompiler }
}

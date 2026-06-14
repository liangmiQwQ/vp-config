import { existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

import { definePlugin, defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'

const packageName = '@liangmi/vp-config'
const ruleName = 'load-vp-config-correctly'
const pluginName = 'liangmi'
const projectConfigNames = ['cli', 'lib', 'website'] as const
const rootConfigNames = ['base'] as const
const configNames = [...rootConfigNames, ...projectConfigNames] as const
const packageConfigFieldNames = new Set(['build', 'pack', 'plugins'])

type ConfigName = (typeof configNames)[number]

export function getAllowedConfigNames(
  filename: string,
  isPackageConfig = isPackageConfigDirectory(dirname(filename))
): readonly ConfigName[] {
  if (basename(filename) !== 'vite.config.ts') {
    return []
  }

  return isPackageConfig ? projectConfigNames : rootConfigNames
}

export function isVpConfigImportAllowed(
  filename: string,
  importedNames: readonly string[],
  isPackageConfig?: boolean
): boolean {
  const allowedNames = getAllowedConfigNames(filename, isPackageConfig)
  const allowedNameSet = new Set<string>(allowedNames)

  return (
    allowedNames.length > 0 &&
    importedNames.length > 0 &&
    importedNames.every(name => allowedNameSet.has(name))
  )
}

const loadVpConfigCorrectlyRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Load @liangmi/vp-config from vite.config.ts with the correct category.',
      recommended: true
    },
    messages: {
      outsideConfig: 'Import @liangmi/vp-config only from vite.config.ts.',
      wrongCategory: 'Use {{allowed}} from @liangmi/vp-config in this vite.config.ts.'
    }
  },
  create(context) {
    let isPackageConfig = isPackageConfigDirectory(dirname(context.filename))
    const moduleReferences: { filename: string; node: ESTree.Node; specifier: string }[] = []
    const imports: { importedNames: readonly string[]; node: ESTree.Node }[] = []

    const reportModuleReference = (
      filename: string,
      specifier: string,
      node: ESTree.Node
    ): void => {
      if (!isVpConfigSpecifier(specifier)) {
        return
      }

      context.report({
        node,
        messageId: basename(filename) === 'vite.config.ts' ? 'wrongCategory' : 'outsideConfig',
        data: {
          allowed: getAllowedConfigNames(filename, isPackageConfig)
            .map(name => `{ ${name} }`)
            .join(' or ')
        }
      })
    }

    const reportWrongCategory = (node: ESTree.Node, importedNames: readonly string[]): void => {
      if (isVpConfigImportAllowed(context.filename, importedNames, isPackageConfig)) {
        return
      }

      const allowedNames = getAllowedConfigNames(context.filename, isPackageConfig)
      context.report({
        node,
        messageId: allowedNames.length > 0 ? 'wrongCategory' : 'outsideConfig',
        data: {
          allowed: allowedNames.map(name => `{ ${name} }`).join(' or ')
        }
      })
    }

    return {
      'Program:exit'(): void {
        for (const moduleReference of moduleReferences) {
          reportModuleReference(
            moduleReference.filename,
            moduleReference.specifier,
            moduleReference.node
          )
        }

        for (const importReference of imports) {
          reportWrongCategory(importReference.node, importReference.importedNames)
        }
      },
      ImportDeclaration(node): void {
        if (!isVpConfigSpecifier(node.source.value)) {
          return
        }

        imports.push({
          importedNames: getImportDeclarationNames(node),
          node: node.source
        })
      },
      ExportAllDeclaration(node): void {
        moduleReferences.push({
          filename: context.filename,
          node: node.source,
          specifier: node.source.value
        })
      },
      ExportNamedDeclaration(node): void {
        if (node.source) {
          moduleReferences.push({
            filename: context.filename,
            node: node.source,
            specifier: node.source.value
          })
        }
      },
      ImportExpression(node): void {
        if (isStringLiteral(node.source)) {
          moduleReferences.push({
            filename: context.filename,
            node: node.source,
            specifier: node.source.value
          })
        }
      },
      ObjectExpression(node): void {
        if (isPackageConfig) {
          return
        }

        isPackageConfig = node.properties.some(
          property =>
            isStaticProperty(property) && packageConfigFieldNames.has(getPropertyName(property))
        )
      }
    }
  }
})

// oxlint-disable-next-line import/no-default-export
export default definePlugin({
  meta: { name: pluginName },
  rules: { [ruleName]: loadVpConfigCorrectlyRule }
})

function isVpConfigSpecifier(specifier: string): boolean {
  return specifier === packageName
}

function getImportDeclarationNames(node: ESTree.ImportDeclaration): string[] {
  return node.specifiers.flatMap(specifier =>
    specifier.type === 'ImportSpecifier' ? [getModuleExportName(specifier.imported)] : []
  )
}

function getModuleExportName(name: ESTree.ModuleExportName): string {
  return name.type === 'Literal' ? name.value : name.name
}

function isStringLiteral(node: ESTree.Node): node is ESTree.StringLiteral {
  return node.type === 'Literal' && typeof node.value === 'string'
}

function isPackageConfigDirectory(directory: string): boolean {
  return existsSync(join(directory, 'index.html'))
}

function isStaticProperty(
  property: ESTree.ObjectExpression['properties'][number]
): property is ESTree.ObjectProperty & { key: ESTree.IdentifierName | ESTree.StringLiteral } {
  return (
    property.type === 'Property' &&
    !property.computed &&
    (property.key.type === 'Identifier' || isStringLiteral(property.key))
  )
}

function getPropertyName(
  property: ESTree.ObjectProperty & { key: ESTree.IdentifierName | ESTree.StringLiteral }
): string {
  return property.key.type === 'Identifier' ? property.key.name : property.key.value
}

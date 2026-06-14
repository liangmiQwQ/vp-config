import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

import { definePlugin, defineRule } from '@oxlint/plugins'
import type { ESTree } from '@oxlint/plugins'

const packageName = '@liangmi/vp-config'
const ruleName = 'load-vp-config-correctly'
const pluginName = 'liangmi'
const projectConfigNames = ['cli', 'lib', 'website'] as const
const rootConfigNames = ['base'] as const
const configNames = [...rootConfigNames, ...projectConfigNames] as const

type ConfigName = (typeof configNames)[number]

export function getAllowedConfigNames(filename: string): readonly ConfigName[] {
  if (basename(filename) !== 'vite.config.ts') {
    return []
  }

  return isWorkspaceRootConfigDirectory(dirname(filename)) ? rootConfigNames : projectConfigNames
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
          allowed: getAllowedConfigNames(filename)
            .map(name => `{ ${name} }`)
            .join(' or ')
        }
      })
    }

    const reportWrongCategory = (node: ESTree.Node, importedNames: readonly string[]): void => {
      if (isVpConfigImportAllowed(context.filename, importedNames)) {
        return
      }

      const allowedNames = getAllowedConfigNames(context.filename)
      context.report({
        node,
        messageId: allowedNames.length > 0 ? 'wrongCategory' : 'outsideConfig',
        data: {
          allowed: allowedNames.map(name => `{ ${name} }`).join(' or ')
        }
      })
    }

    return {
      ImportDeclaration(node): void {
        if (!isVpConfigSpecifier(node.source.value)) {
          return
        }

        reportWrongCategory(node.source, getImportDeclarationNames(node))
      },
      ExportAllDeclaration(node): void {
        reportModuleReference(context.filename, node.source.value, node.source)
      },
      ExportNamedDeclaration(node): void {
        if (node.source) {
          reportModuleReference(context.filename, node.source.value, node.source)
        }
      },
      ImportExpression(node): void {
        if (isStringLiteral(node.source)) {
          reportModuleReference(context.filename, node.source.value, node.source)
        }
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

function isWorkspaceRootConfigDirectory(directory: string): boolean {
  if (existsSync(join(directory, 'pnpm-workspace.yaml'))) {
    return true
  }

  const packageJsonPath = join(directory, 'package.json')
  if (!existsSync(packageJsonPath)) {
    return false
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    workspaces?: unknown
  }

  return Boolean(packageJson.workspaces)
}

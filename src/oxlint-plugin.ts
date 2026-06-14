import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

const packageName = '@liangmi/vp-config'
const ruleName = 'load-vp-config-correctly'
const pluginName = 'liangmi'
const projectConfigNames = ['cli', 'lib', 'website'] as const
const rootConfigNames = ['base'] as const
const configNames = [...rootConfigNames, ...projectConfigNames] as const

type ConfigName = (typeof configNames)[number]
interface LintNode {
  type: string
  value?: unknown
}
type StringLiteral = LintNode & {
  type: 'Literal'
  value: string
}
type IdentifierName = LintNode & {
  type: 'Identifier'
  name: string
}
type ModuleExportName = IdentifierName | StringLiteral
interface ImportSpecifier {
  type: 'ImportSpecifier'
  imported: ModuleExportName
}
type ImportDeclarationSpecifier =
  | ImportSpecifier
  | {
      type: 'ImportDefaultSpecifier' | 'ImportNamespaceSpecifier'
    }
interface ImportDeclaration {
  source: StringLiteral
  specifiers: ImportDeclarationSpecifier[]
}
interface ExportAllDeclaration {
  source: StringLiteral
}
interface ExportNamedDeclaration {
  source: StringLiteral | null
}
interface ImportExpression {
  source: LintNode | StringLiteral
}
interface RuleContext {
  filename: string
  report: (diagnostic: { data?: Record<string, string>; messageId: string; node: LintNode }) => void
}
interface VisitorObject {
  ExportAllDeclaration: (node: ExportAllDeclaration) => void
  ExportNamedDeclaration: (node: ExportNamedDeclaration) => void
  ImportDeclaration: (node: ImportDeclaration) => void
  ImportExpression: (node: ImportExpression) => void
}
interface Rule {
  create: (context: RuleContext) => VisitorObject
  meta: {
    docs: {
      description: string
      recommended: boolean
    }
    messages: Record<string, string>
    type: 'problem'
  }
}
interface Plugin {
  meta: {
    name: string
  }
  rules: Record<string, Rule>
}

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

const loadVpConfigCorrectlyRule: Rule = {
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
    const reportModuleReference = (filename: string, specifier: string, node: LintNode): void => {
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

    const reportWrongCategory = (node: LintNode, importedNames: readonly string[]): void => {
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
}

export default {
  meta: { name: pluginName },
  rules: { [ruleName]: loadVpConfigCorrectlyRule }
} satisfies Plugin

function isVpConfigSpecifier(specifier: string): boolean {
  return specifier === packageName
}

function getImportDeclarationNames(node: ImportDeclaration): string[] {
  return node.specifiers.flatMap(specifier =>
    specifier.type === 'ImportSpecifier' ? [getModuleExportName(specifier.imported)] : []
  )
}

function getModuleExportName(name: ModuleExportName): string {
  return name.type === 'Literal' ? name.value : name.name
}

function isStringLiteral(node: LintNode): node is StringLiteral {
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

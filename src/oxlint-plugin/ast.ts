import type { ESTree } from '@oxlint/plugins'

import { packageName } from './constants.ts'

export function isVpConfigSpecifier(specifier: string): boolean {
  return specifier === packageName
}

export function getImportDeclarationNames(node: ESTree.ImportDeclaration): string[] {
  return node.specifiers.flatMap(specifier =>
    specifier.type === 'ImportSpecifier' ? [getModuleExportName(specifier.imported)] : []
  )
}

export function getModuleExportName(name: ESTree.ModuleExportName): string {
  return name.type === 'Literal' ? name.value : name.name
}

export function isStringLiteral(node: ESTree.Node): node is ESTree.StringLiteral {
  return node.type === 'Literal' && typeof node.value === 'string'
}

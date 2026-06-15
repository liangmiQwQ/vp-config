import type { ESTree } from '@oxlint/plugins'

import { packageName } from './constants.ts'

export function isVpConfigSpecifier(specifier: string): boolean {
  return specifier === packageName
}

export function isStringLiteral(node: ESTree.Node): node is ESTree.StringLiteral {
  return node.type === 'Literal' && typeof node.value === 'string'
}

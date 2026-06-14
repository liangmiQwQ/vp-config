import { defineRule } from '@oxlint/plugins'
import type { ESTree, Fix, Rule } from '@oxlint/plugins'

import {
  getImportDeclarationNames,
  getModuleExportName,
  isStringLiteral,
  isVpConfigSpecifier
} from './ast.ts'
import { configNames, packageName } from './constants.ts'
import {
  cleanupRuntimeInfo,
  getConfigDirectory,
  inferProjectCategory,
  readRuntimeInfo,
  shouldCleanupRuntimeInfo
} from './info.ts'
import {
  getAllowedConfigNames,
  hasPackageJson,
  isViteConfigFile,
  isVpConfigImportAllowed
} from './project.ts'

export const noOrphanViteConfigRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require vite.config files to live next to package.json.',
      recommended: true
    },
    messages: {
      orphan: 'Keep vite.config.ts next to package.json.'
    }
  },
  create(context) {
    return {
      Program(node): void {
        if (
          isViteConfigFile(context.filename) &&
          !hasPackageJson(getConfigDirectory(context.filename))
        ) {
          context.report({ node, messageId: 'orphan' })
        }
      }
    }
  }
})

export const noUselessVpPresetImportsRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: `Disallow importing ${packageName} outside vite.config files.`,
      recommended: true
    },
    messages: {
      outsideConfig: `Import ${packageName} only from vite.config.ts.`
    }
  },
  create(context) {
    const reportModuleReference = (node: ESTree.Node, specifier: string): void => {
      if (!isVpConfigSpecifier(specifier) || isViteConfigFile(context.filename)) {
        return
      }

      context.report({ node, messageId: 'outsideConfig' })
    }

    return {
      ImportDeclaration(node): void {
        reportModuleReference(node.source, node.source.value)
      },
      ExportAllDeclaration(node): void {
        reportModuleReference(node.source, node.source.value)
      },
      ExportNamedDeclaration(node): void {
        if (node.source) {
          reportModuleReference(node.source, node.source.value)
        }
      },
      ImportExpression(node): void {
        if (isStringLiteral(node.source)) {
          reportModuleReference(node.source, node.source.value)
        }
      }
    }
  }
})

export const usePresetVpConfigRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require vite.config.ts to be loaded through @liangmi/vp-config.',
      recommended: true
    },
    messages: {
      missingRuntimeInfo: `Load vite.config.ts through ${packageName} so lint rules can inspect runtime config.`
    }
  },
  create(context) {
    return {
      Program(node): void {
        if (!isViteConfigFile(context.filename)) {
          return
        }

        if (!readRuntimeInfo(getConfigDirectory(context.filename))) {
          context.report({ node, messageId: 'missingRuntimeInfo' })
        }
      }
    }
  }
})

export const loadProperVpConfigCategoryRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: `Load ${packageName} with a category that matches the package role.`,
      recommended: true
    },
    fixable: 'code',
    messages: {
      wrongCategory: `Use {{expected}} from ${packageName} in this vite.config.ts.`
    }
  },
  create(context) {
    const info = readRuntimeInfo(getConfigDirectory(context.filename))

    return {
      ImportDeclaration(node): void {
        if (!isViteConfigFile(context.filename) || !isVpConfigSpecifier(node.source.value)) {
          return
        }

        const importedNames = getImportDeclarationNames(node)

        if (isVpConfigImportAllowed(context.filename, importedNames)) {
          return
        }

        const expected = info
          ? getExpectedCategory(info.project.isProject, inferProjectCategory(info))
          : undefined
        const allowed = expected ? [expected] : getAllowedConfigNames(context.filename)
        const reportNode = node.source

        context.report({
          node: reportNode,
          messageId: 'wrongCategory',
          data: {
            expected: allowed.map(name => `{ ${name} }`).join(' or ')
          },
          fix: expected
            ? (fixer): Fix[] =>
                node.specifiers.flatMap(specifier =>
                  specifier.type === 'ImportSpecifier' &&
                  configNames.includes(
                    getModuleExportName(specifier.imported) as (typeof configNames)[number]
                  )
                    ? [fixer.replaceText(specifier.imported, expected)]
                    : []
                )
            : undefined
        })
      }
    }
  }
})

export const noMixedProjectRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow a vite config that is both website and library project.',
      recommended: true
    },
    messages: {
      mixed: 'Do not mix website and library project signals in one vite.config.ts.'
    }
  },
  create(context) {
    return {
      Program(node): void {
        const info = readRuntimeInfo(getConfigDirectory(context.filename))

        if (isViteConfigFile(context.filename) && info?.project.isWebsite && info.project.isLib) {
          context.report({ node, messageId: 'mixed' })
        }
      }
    }
  }
})

export const cleanupRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Remove temporary @liangmi/vp-config runtime lint information.',
      recommended: true
    }
  },
  create(context) {
    return {
      'Program:exit'(): void {
        const configDirectory = getConfigDirectory(context.filename)

        if (isViteConfigFile(context.filename) && shouldCleanupRuntimeInfo(configDirectory)) {
          cleanupRuntimeInfo(configDirectory)
        }
      }
    }
  }
})

export const rules: Record<string, Rule> = {
  'no-orphan-vite-config': noOrphanViteConfigRule,
  'no-useless-vp-preset-imports': noUselessVpPresetImportsRule,
  'use-preset-vp-config': usePresetVpConfigRule,
  'load-proper-vp-config-category': loadProperVpConfigCategoryRule,
  'no-mixed-project': noMixedProjectRule,
  cleanup: cleanupRule
}

function getExpectedCategory(
  isProject: boolean,
  inferredProjectCategory: string | undefined
): string {
  return isProject ? (inferredProjectCategory ?? 'lib') : 'base'
}

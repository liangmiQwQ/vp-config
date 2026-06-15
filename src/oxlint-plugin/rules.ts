import { dirname } from 'node:path'

import { defineRule } from '@oxlint/plugins'
import type { ESTree, Rule } from '@oxlint/plugins'

import { isStringLiteral, isVpConfigSpecifier } from './ast.ts'
import { packageName, projectConfigNames, rootConfigNames } from './constants.ts'
import { ensureRuntimeInfo, isLibProject, isProject, isWebsiteProject } from './info.ts'
import { hasPackageJson, isViteConfigFile } from './project.ts'

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
        if (isViteConfigFile(context.filename) && !hasPackageJson(dirname(context.filename))) {
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

        if (!ensureRuntimeInfo(context.filename)) {
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
    messages: {
      wrongCategory: `Use {{expected}} from ${packageName} in this vite.config.ts.`
    }
  },
  create(context) {
    return {
      Program(node): void {
        if (!isViteConfigFile(context.filename)) {
          return
        }

        const info = ensureRuntimeInfo(context.filename)

        if (!info?.category) {
          return
        }

        const allowed: readonly string[] = isProject(info) ? projectConfigNames : rootConfigNames

        if (allowed.includes(info.category)) {
          return
        }

        context.report({
          node,
          messageId: 'wrongCategory',
          data: {
            expected: allowed.map(name => `{ ${name} }`).join(' or ')
          }
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
        if (!isViteConfigFile(context.filename)) {
          return
        }

        const info = ensureRuntimeInfo(context.filename)

        if (info && isWebsiteProject(info) && isLibProject(info)) {
          context.report({ node, messageId: 'mixed' })
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
  'no-mixed-project': noMixedProjectRule
}

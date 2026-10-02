import type { OxfmtConfig, OxfmtOverrideConfig } from 'vite-plus/fmt'

import type { Project } from '../project/index.ts'
import { isReact, isTailwindcss, isVue } from '../project/traits.ts'

export const fmtBase: OxfmtConfig = {
  arrowParens: 'avoid',
  embeddedLanguageFormatting: 'off',
  singleQuote: true,
  sortImports: {
    partitionByComment: true
  },
  sortPackageJson: {
    sortScripts: true
  },
  semi: false,
  trailingComma: 'none'
}

// Component frameworks embed other languages, including React Ink / Vue TUI in CLI projects.
const componentFmt: OxfmtConfig = {
  jsxSingleQuote: true,
  embeddedLanguageFormatting: 'auto'
}

const tailwindcssFmt: OxfmtConfig = {
  sortTailwindcss: true
}

export function deriveFmt(projects: Project[]): OxfmtConfig {
  const [onlyProject] = projects

  if (projects.length === 1) {
    return { ...fmtBase, ...fmtTraits(onlyProject) }
  }

  return { ...fmtBase, overrides: projects.flatMap(projectOverride) }
}

function projectOverride(project: Project): OxfmtOverrideConfig[] {
  const options = fmtTraits(project)

  return Object.keys(options).length > 0 ? [{ ...project.scope, options }] : []
}

function fmtTraits(project: Project): OxfmtConfig {
  return {
    ...(isReact(project) || isVue(project) ? componentFmt : {}),
    ...(isTailwindcss(project) ? tailwindcssFmt : {})
  }
}

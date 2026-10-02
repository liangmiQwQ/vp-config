import type { OxfmtConfig, OxfmtOverrideConfig } from 'vite-plus/fmt'

import type { Project, ProjectFacts } from '../project/index.ts'

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
    return { ...fmtBase, ...fmtFacts(onlyProject.facts) }
  }

  return { ...fmtBase, overrides: projects.flatMap(projectOverride) }
}

function projectOverride(project: Project): OxfmtOverrideConfig[] {
  const options = fmtFacts(project.facts)

  return Object.keys(options).length > 0 ? [{ ...project.scope, options }] : []
}

function fmtFacts(facts: ProjectFacts): OxfmtConfig {
  const isComponentProject = facts.frameworks.some(framework => framework !== 'tailwindcss')

  return {
    ...(isComponentProject ? componentFmt : {}),
    ...(facts.frameworks.includes('tailwindcss') ? tailwindcssFmt : {})
  }
}

import { join } from 'node:path'

import { expect, it } from 'vite-plus/test'

import { deriveFmt } from '../src/preset/fmt.ts'
import { resolveProjectContext } from '../src/project/index.ts'

const workspace = join(import.meta.dirname, 'fixtures/workspace')

it('should disable embedded language formatting by default', () => {
  expect(
    deriveFmt([
      {
        path: '.',
        scope: { files: ['**'] },
        facts: { runtime: 'node', frameworks: [], lib: true, cli: false }
      }
    ])
  ).toMatchObject({ embeddedLanguageFormatting: 'off' })
})

it('should enable embedded language formatting for a single component project', () => {
  const fmt = deriveFmt([
    {
      path: '.',
      scope: { files: ['**'] },
      facts: { runtime: 'browser', frameworks: ['react'], lib: false, cli: false }
    }
  ])

  expect(fmt).toMatchObject({ embeddedLanguageFormatting: 'auto', jsxSingleQuote: true })
  expect(fmt).not.toHaveProperty('overrides')
})

it('should generate scoped overrides for workspace projects', () => {
  const { projects } = resolveProjectContext(workspace)
  const fmt = deriveFmt(projects)

  expect(fmt.embeddedLanguageFormatting).toBe('off')
  expect(fmt.overrides).toStrictEqual([
    {
      files: ['apps/web/**'],
      options: { embeddedLanguageFormatting: 'auto', jsxSingleQuote: true, sortTailwindcss: true }
    },
    {
      files: ['packages/cli/**'],
      options: { embeddedLanguageFormatting: 'auto', jsxSingleQuote: true }
    },
    {
      files: ['packages/lib/**'],
      options: { embeddedLanguageFormatting: 'auto', jsxSingleQuote: true }
    }
  ])
})

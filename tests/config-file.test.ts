import { mkdtempSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { expect, it } from 'vite-plus/test'

import { findConfigDirectory } from '../src/project/config-file.ts'

const repo = mkdtempSync(join(tmpdir(), 'vp-config-'))
const member = join(repo, 'packages/a')

function createStack(...frames: string[]): string {
  return ['Error: Find vite config', ...frames.map(frame => `    at ${frame}`)].join('\n')
}

it('should find the config file loaded natively', () => {
  const stack = createStack(
    `liangmi (${pathToFileURL(join(repo, 'node_modules/@liangmi/vp-config/dist/index.mjs')).href}:1:1)`,
    `${pathToFileURL(join(member, 'vite.config.ts')).href}:3:16`
  )

  expect(findConfigDirectory(stack)).toBe(member)
})

it('should find the original config file of a bundled config', async () => {
  const bundled = join(repo, 'vite.config.ts.timestamp-1790933115473-3446edcfaf498.mjs')

  const sourceMap = {
    version: 3,
    sources: [join(repo, 'tooling/lint.ts'), join(member, 'vite.config.ts')]
  }

  await writeFile(
    bundled,
    [
      'export default {}',
      `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(JSON.stringify(sourceMap)).toString('base64')}`
    ].join('\n')
  )

  const stack = createStack(`${pathToFileURL(bundled).href}:2:197`)

  expect(findConfigDirectory(stack)).toBe(member)
})

it('should ignore stacks without config files', () => {
  const stack = createStack(`${pathToFileURL(join(repo, 'src/index.ts')).href}:1:1`)

  expect(findConfigDirectory(stack)).toBeUndefined()
  expect(findConfigDirectory()).toBeUndefined()
})

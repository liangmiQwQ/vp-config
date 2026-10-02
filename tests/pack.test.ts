import { expect, it } from 'vite-plus/test'

import { mergePresetConfig } from '../src/merge.ts'
import { derivePack } from '../src/preset/pack.ts'
import type { ProjectFacts } from '../src/project/index.ts'

const facts: ProjectFacts = { runtime: 'node', frameworks: [], lib: false, cli: false }

it('should derive pack config from lib and cli facts', () => {
  expect(derivePack(facts)).toBeUndefined()
  expect(derivePack({ ...facts, lib: true })).toMatchObject({ exports: true, minify: false })
  expect(derivePack({ ...facts, cli: true })).toMatchObject({ dts: false, minify: true })
})

it('should prefer lib defaults for a project shipping both', () => {
  expect(derivePack({ ...facts, lib: true, cli: true })).toStrictEqual({
    dts: { generator: 'tsgo' },
    exports: true,
    fixedExtension: true,
    minify: false,
    nodeProtocol: 'strip',
    platform: 'node'
  })
})

it('should merge pack preset with every array item', () => {
  expect(
    mergePresetConfig(
      { pack: { dts: true, exports: true } },
      {
        pack: [
          {
            entry: ['./src/index.ts']
          },
          {
            dts: false,
            entry: ['./src/cli.ts']
          }
        ]
      }
    )
  ).toMatchObject({
    pack: [
      {
        dts: true,
        entry: ['./src/index.ts'],
        exports: true
      },
      {
        dts: false,
        entry: ['./src/cli.ts'],
        exports: true
      }
    ]
  })
})

import { expect, it } from 'vite-plus/test'

import { mergePresetConfig } from '../src/merge.ts'
import { derivePack } from '../src/preset/pack.ts'
import { createTestProject } from './project-fixture.ts'

it('should derive pack config from lib and cli traits', () => {
  expect(derivePack(createTestProject({}))).toBeUndefined()
  expect(derivePack(createTestProject({ packageExports: true }))).toMatchObject({
    exports: true,
    minify: false
  })
  expect(derivePack(createTestProject({ packageBin: true }))).toMatchObject({
    dts: false,
    minify: true
  })
})

it('should prefer declared traits over facts', () => {
  expect(derivePack(createTestProject({ packageExports: true }, { lib: false }))).toBeUndefined()
})

it('should prefer lib defaults for a project shipping both', () => {
  expect(derivePack(createTestProject({ packageExports: true, packageBin: true }))).toStrictEqual({
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

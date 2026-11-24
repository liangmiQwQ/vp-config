import { expect, it } from 'vite-plus/test'

import { liangmi } from '../src/index.ts'
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

it('should merge pack defaults with each build and respect its entry', async () => {
  const config = await liangmi({
    pack: [{}, { dts: false, entry: ['src/cli.ts'] }, { entry: { worker: 'src/worker.ts' } }]
  })

  expect(config.pack).toMatchObject([
    { dts: { generator: 'tsgo' }, entry: ['src/index.ts'], exports: true },
    { dts: false, entry: ['src/cli.ts'], exports: true },
    { entry: { worker: 'src/worker.ts' }, exports: true }
  ])
})

import { expect, it } from 'vite-plus/test'

import { createConfigEntry } from '../src/entry.ts'

const config = createConfigEntry({
  pack: {
    dts: true,
    exports: true
  }
})

it('should merge pack preset with object config', () => {
  expect(
    config({
      pack: {
        exports: false,
        minify: true
      }
    })
  ).toMatchObject({
    pack: {
      dts: true,
      exports: false,
      minify: true
    }
  })
})

it('should merge pack preset with every array item', () => {
  expect(
    config({
      pack: [
        {
          entry: ['./src/index.ts']
        },
        {
          dts: false,
          entry: ['./src/cli.ts']
        }
      ]
    })
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

import { lib } from './src/index.ts'

export default lib({
  staged: {
    '*': 'vp check --fix'
  },
  pack: [
    {
      dts: {
        tsgo: true
      },
      entry: ['./src/index.ts'],
      exports: true
    },
    {
      dts: {
        tsgo: true
      },
      entry: ['./src/oxlint-plugin.ts'],
      exports: false
    }
  ]
})

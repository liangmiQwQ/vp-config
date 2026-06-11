import { lib } from './src/index.ts'

export default lib({
  staged: {
    '*': 'vp check --fix'
  },
  pack: {
    dts: {
      tsgo: true
    },
    exports: true
  }
})

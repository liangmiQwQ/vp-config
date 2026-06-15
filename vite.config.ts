import { lib } from './src/index.ts'

export default lib({
  staged: {
    '*': 'vp check --fix'
  },
  pack: {
    entry: ['./src/index.ts', './src/oxlint-plugin/index.ts']
  }
})

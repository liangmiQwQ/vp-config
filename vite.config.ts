import { lib } from './src/index.ts'

export default lib({
  pack: {
    entry: ['./src/index.ts', './src/oxlint-plugin/index.ts']
  }
})

import { liangmi } from './src/index.ts'

export default await liangmi({
  pack: {
    entry: ['./src/index.ts'],
    deps: {
      // Config loading helpers are bundled, so users only install `vite-plus`.
      onlyBundle: ['fdir', 'get-tsconfig', 'picomatch', 'resolve-pkg-maps', 'tinyglobby', 'yaml']
    }
  }
})

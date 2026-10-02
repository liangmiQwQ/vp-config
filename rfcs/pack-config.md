# RFC: pack config

`pack` is derived from the `lib` and `cli` facts of the [project model](./detection.md). `pack.entry` is still written by hand.

```ts
import { liangmi } from '@liangmi/vp-config'

export default await liangmi({
  pack: { entry: ['src/index.ts', 'src/cli.ts'] }
})
```

When a project is both `lib` and `cli`, the `lib` defaults take priority where they conflict. For example, the output is not minified and declarations are generated.

Website projects have neither fact, they use Vite's `build`.

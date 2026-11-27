# RFC: pack config

`pack` is derived from the `lib` and `cli` traits of the [project model](./detection.md). Each build defaults to `src/index.ts`. An explicit `pack.entry` replaces that default.

```ts
import { liangmi } from '@liangmi/vp-config'

export default liangmi({
  pack: { entry: ['src/index.ts', 'src/cli.ts'] }
})
```

When a project is both `lib` and `cli`, the `lib` defaults take priority where they conflict. For example, the output is not minified and declarations are generated.

Website projects have neither fact, they use Vite's `build`.

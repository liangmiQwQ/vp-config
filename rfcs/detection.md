# RFC: Project detection

Lint and fmt config are only emitted by the workspace root, see [Config Entry](./config-entry.md). The root config has to know about every project to generate `lint.overrides` and `fmt.overrides`. It can't execute member configs, so the facts of each project must be statically readable.

Each project is described with these facts:

- `runtime`: `node`, `browser` or `universal`
- `frameworks`: like `react`, `vue`, `ink` and `tailwindcss`
- `lib`: whether the project ships a library
- `cli`: whether the project ships an executable

## Project discovery

Projects are the workspace members and the workspace root. Directories with their own `package.json` that are not workspace members can be added by the `projects` option in the root config.

## Detection

Facts are detected from committed files by default.

- `exports` in `package.json`: `lib`
- `bin` in `package.json`: `cli` and `node` runtime
- Dependencies in `package.json`: frameworks
- `index.html` near `vite.config.ts`: `browser` runtime
- `lib` and `types` in `tsconfig.json`: `DOM` in `lib` means `browser` runtime, `node` in `types` means `node` runtime

When there is evidence for both `browser` and `node` runtimes, the project is `universal`.

`vp pack` never creates `exports` or `bin`. It only refines the fields which already exist, so they are always committed and can be detected reliably.

## Declaration

When detection is wrong, facts can be declared with `.option()` in the root config. Declared facts override the detected ones.

```ts
import { liangmi } from '@liangmi/vp-config'

export default await liangmi({}).option({
  projects: {
    'apps/api': { runtime: 'node' }
  }
})
```

## Derivation

Every tool's config is derived from the same facts.

| Fact              | lint              | fmt                         | test                | pack                            |
| ----------------- | ----------------- | --------------------------- | ------------------- | ------------------------------- |
| `node` runtime    | Node rules        | —                           | Node environment    | —                               |
| `lib`             | —                 | —                           | —                   | Declarations, refined `exports` |
| `cli`             | `console` allowed | —                           | —                   | Node target, minified           |
| `browser` runtime | Browser rules     | —                           | Browser environment | —                               |
| `react` / `vue`   | Component rules   | JSX and embedded formatting | —                   | —                               |
| `tailwindcss`     | —                 | Tailwind CSS sorting        | —                   | —                               |

File roles (tests, scripts, config files) are applied by globs inside each project, and the globs are rebased under the project path. For example, `scripts/**` of `packages/foo` becomes `packages/foo/scripts/**`.

The generated overrides are ordered as: the base config, project facts, file roles, then user overrides.

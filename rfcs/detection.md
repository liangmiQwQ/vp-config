# RFC: Project detection

Lint and fmt config are only emitted by the workspace root, see [Config Entry](./config-entry.md). The root config has to know about every project to generate `lint.overrides` and `fmt.overrides`. It can't execute member configs, so the facts of each project must be statically readable.

Each project is described with these facts:

- `node`: whether the project runs in Node
- `browser`: whether the project runs in browsers
- `frameworks`: like `react`, `vue`, `ink` and `tailwindcss`
- `lib`: whether the project ships a library
- `cli`: whether the project ships an executable

## Project discovery

Projects are the workspace members and the workspace root. Directories with their own `package.json` that are not workspace members can be added by declaring them in the root config, see [Declaration](#declaration).

## Detection

Facts are detected from committed files by default.

- `exports` in `package.json`: `lib`
- `bin` in `package.json`: `cli` and `node`
- Dependencies in `package.json`: frameworks
- `index.html` near `vite.config.ts`: `browser`
- `lib` and `types` in `tsconfig.json`: `DOM` in `lib` means `browser`, `node` in `types` means `node`

`node` and `browser` are independent, so a universal project has both of them.

`vp pack` never creates `exports` or `bin`. It only refines the fields which already exist, so they are always committed and can be detected reliably.

## Declaration

When detection is wrong, facts can be declared with `.option()` in the root config. It takes a flat list of projects, each one identified by its `path` relative to the workspace root. Declared facts override the detected ones, and undeclared facts are still detected.

```ts
import { liangmi } from '@liangmi/vp-config'

export default await liangmi({}).option([
  { path: 'apps/api', node: true },
  { path: 'tools/codegen', cli: true }
])
```

A `path` that is not a workspace member adds that directory as a project.

## Derivation

Every tool's config is derived from the same facts.

| Fact            | lint              | fmt                         | test                | pack                            |
| --------------- | ----------------- | --------------------------- | ------------------- | ------------------------------- |
| `node`          | Node rules        | —                           | Node environment    | —                               |
| `lib`           | —                 | —                           | —                   | Declarations, refined `exports` |
| `cli`           | `console` allowed | —                           | —                   | Node target, minified           |
| `browser`       | Browser rules     | —                           | Browser environment | —                               |
| `react` / `vue` | Component rules   | JSX and embedded formatting | —                   | —                               |
| `tailwindcss`   | —                 | Tailwind CSS sorting        | —                   | —                               |

File roles (tests, scripts, config files) are applied by globs inside each project, and the globs are rebased under the project path. For example, `scripts/**` of `packages/foo` becomes `packages/foo/scripts/**`.

The generated overrides are ordered as: the base config, project facts, file roles, then user overrides.

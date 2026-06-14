# RFC: lint config

Settings for `lint` part of Vite+ (Oxlint).

We enable `typeAware` and `typeCheck` linting by default.

We mark as `warn` for code format lint rules that process with linter (e.g. `import/first`), and other rules should report `error`.

`console.log` is not allowed, except in `cli` category.

## `liangmi` Oxlint Plugin

We define a `liangmi` Oxlint JsPlugin, it is mainly to make sure users load this config in a proper way.

We hope users load project in these way:

- `base` category for `vite.config.ts` in a workspace root
- `cli` | `lib` | `website` category for `vite.config.ts` in a project (no matter whether it is in a monorepo)

We provide correctness rule `liangmi/load-vp-config-correctly` to report cases that don't follow the rule above. Also, this rule disallows all `@liangmi/vp-config` imports outside of `vite.config.ts`.

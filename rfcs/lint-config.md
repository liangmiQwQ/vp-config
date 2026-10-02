# RFC: lint config

Settings for `lint` part of Vite+ (Oxlint).

We enable `typeAware` and `typeCheck` linting by default.

We mark as `warn` for code format lint rules that process with linter (e.g. `import/first`), and other rules should report `error`.

`console.log` is not allowed, except in `cli` projects and script files.

Lint config is only emitted by the workspace root (or the only project in a single-package repo). Project-specific rules are generated as `overrides` from the project model, see [Config Entry](./config-entry.md).

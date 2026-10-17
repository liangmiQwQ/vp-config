# RFC: lint config

Settings for `lint` part of Vite+ (Oxlint).

We enable `typeAware` and `typeCheck` linting by default.

We mark as `warn` for code format lint rules that process with linter (e.g. `import/first`), and other rules should report `error`.

`console.log` is not allowed, except in `cli` projects and script files.

Lint config is only emitted by the workspace root (or the only project in a single-package repo). Project-specific rules are generated as `overrides` from the project model, see [Project detection](./detection.md).

## Flat config (experimental)

The preset is written as an ESLint-style flat config array with [`oxlint-flat-config`](https://github.com/liangmiQwQ/oxlint-flat-config), which builds it into an Oxlint config. Objects apply in order: base, project traits, file roles, then the user's `lint` objects.

Every preset object is named, like `liangmi/style`, `liangmi/react` or `liangmi/packages/cli/react`, so users change it with the methods of `@oxlint-flat-config/composer` chained on `liangmi()` instead of deep merging.

Oxlint's `categories` field applies before every rule, so the enabled categories are expanded into rules with `category()`. The base is split into one object per category, so users can remove or override a whole category, like `liangmi/style`. Trait and file role objects extend the categories of the plugins they need.

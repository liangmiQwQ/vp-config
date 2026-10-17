# RFC: lint config

Settings for the `lint` part of Vite+ (Oxlint).

## Severity

The lint config prioritizes correctness and fast feedback.

- Rules that prevent bugs report `error`. The `correctness`, `perf`, `suspicious` and `nursery` categories are fully enabled as errors.
- Style and readability rules that the linter can fix (e.g. `import/first`) report `warn`, so they are left to autofixes instead of becoming hand-written tasks.
- `denyWarnings` is enabled, so warnings still fail the lint command and the codebase stays consistent.

`typeAware` and `typeCheck` are enabled by default, so a separate `tsc` run is not needed.

`console.log` is not allowed, except in `cli` projects and script files.

Only `oxlint-disable` comments are respected (`respectEslintDisableDirectives: false`), and unused disable comments report warnings.

## Allowlisted categories

The `restriction`, `pedantic` and `style` categories are not enabled as a whole. Their rules are explicitly allowlisted instead, so lint behavior stays stable across Oxlint upgrades: a new upstream rule in these categories stays disabled until it is reviewed and added.

## Project traits

Lint config is only emitted by the workspace root (or the only project in a single-package repo). Project-specific rules are generated as scoped config objects from the project model, see [Project detection](./detection.md).

## Flat config

The preset is written as an ESLint-style flat config array with [`oxlint-flat-config`](https://github.com/liangmiQwQ/oxlint-flat-config), which builds it into an Oxlint config. Objects apply in order: base, project traits, file roles, then the user's `lint` objects.

Every preset object is named, like `liangmi/style`, `liangmi/react` or `liangmi/packages/cli/react`, so users change it with the methods of `@oxlint-flat-config/composer` chained on `liangmi()` instead of deep merging.

Oxlint's `categories` field applies before every rule, so the enabled categories are expanded into rules with `category()`. The base is split into one object per category, so users can remove or override a whole category, like `liangmi/style`. Trait and file role objects extend the categories of the plugins they need.

Rules expanded by `category()` use plugin-prefixed names, like `eslint/no-debugger`, while hand-written rules mostly use unprefixed names. Names are compared as written, so users must use the same spelling with `overrideRules` and `removeRules`.

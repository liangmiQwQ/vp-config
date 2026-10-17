# RFC: fmt config

The default settings of the `fmt` part of Vite+ (Oxfmt).

The format config follows a simple philosophy: remove syntax that does not improve readability, and let the formatter handle mechanical consistency.

- No semicolons and no trailing commas, since they add noise without helping humans read the code.
- Single quotes, and no parentheses around a single arrow function parameter.
- Imports, `package.json` fields and `package.json` scripts are sorted, so their order never needs to be decided by hand or discussed in review. Comments partition import groups, so a deliberate grouping can still be kept.

## Project traits

Format config is only emitted by the workspace root (or the only project in a single-package repo). Project-specific options are generated as `fmt.overrides` from the project model, see [Project detection](./detection.md).

| Trait           | Options                                            |
| --------------- | -------------------------------------------------- |
| `react` / `vue` | Embedded-language formatting, single quotes in JSX |
| `tailwindcss`   | Tailwind CSS class sorting                         |

Embedded-language formatting is disabled by default. It is enabled for projects using component frameworks like React or Vue, including Vue TUI / React Ink in CLI projects, where templates and styles are embedded in scripts.

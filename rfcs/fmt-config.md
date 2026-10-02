# RFC: fmt config

The default settings of `fmt` part of Vite+ (Oxfmt).

The format config follows `simple` philosophy, it removes unused parts of code, keep code readable for humans.

For example, we do not add `;` or `,` for unnecessary places.

## Project facts

Format config is only emitted by the workspace root (or the only project in a single-package repo). Project-specific options are generated as `fmt.overrides` from the project model, see [Project detection](./detection.md).

We normally disable embedded language formatting. It is enabled for projects using component frameworks like React or Vue, including Vue TUI / React Ink in CLI projects.

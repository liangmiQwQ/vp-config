# RFC: fmt config

The default settings of `fmt` part of Vite+ (Oxfmt).

The format config follows `simple` philosophy, it removes unused parts of code, keep code readable for humans.

For example, we do not add `;` or `,` for unnecessary places.

## Presets

We normally disable embedded language formatting for `base` and `lib` presets.

Considering there can be Vue Tui / React Ink in cli / tui project, we use the same config as `website` for `cli` preset.

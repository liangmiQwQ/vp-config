# @liangmi/vp-config

Liang's united [Vite+](https://viteplus.dev/) config presets for JavaScript development — opinionated, strict and designed to be universal with different kinds of projects.

## Usage

We can install `@liangmi/vp-config` as a `devDependency` with `Vite+`

```bash
vp install -D @liangmi/vp-config
```

And modify your `vite.config.ts` like that:

```typescript
import { base } from "@liangmi/vp-config";

export default base({
  /* Your personal config overrides, will be merged deeply */
});
```

> [!WARN]
> Considering Vite+ is now still alpha, the internal API can be unstable and expected to change, please manage to use `@liangmi/vp-config` with the latest Vite+. If you found something that doesn't work expectedly, please [submit an issue](https://github.com/liangmiQwQ/vp-config/issues/new).

### Categories

We provide four config categories for different kinds of projects.

| Category | Description | Recommended for |
| -------- | ----------- | --------------- |
| `base`   | <!--...-->  | Workspace root  |

<!--...-->

For monorepos, different presets should be used in combination. We should use `base` the workspace root, and use other categories as needed.

### Customizable

<!-- Introduce the usage of config entries. (Like `only`, `exclude`) -->

## What's included by default

Vite+ is a united toolchain for JavaScript development, it includes linting, formatting, library bundling, git hooks, test, task runner, website development, etc.

`@liangmi/vp-config` tries to extract reusable configurations from these, in order to improve the development experience as much as possible.

### Lint

<!-- Lint config, and more -->

## License

[MIT](./LICENSE) License © 2026-PRESENT Liang

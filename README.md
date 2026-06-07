# @liangmi/vp-config

Liang's opinionated Vite+ config presets for JavaScript development, including linting, formatting, task running and more.

It is designed to work with different kinds of project, cli / tui development, library, and website development (WIP, waiting for [Oxlint's better Vue support](https://github.com/oxc-project/oxc/issues/15761))

## Usage

We can install `@liangmi/vp-config` as a `devDependency` with `Vite+`

```bash
vp install -D @liangmi/vp-config
```

And modify your `vite.config.ts` like that:

```typescript
import { cli } from "@liangmi/vp-config";

export default cli({
  /* Your personal config overrides */
});
```

Considering Vite+ is now still alpha, the internal API can be unstable and expected to change, please manage to use `@liangmi/vp-config` with the latest Vite+. If you found something that doesn't work expectedly, please [submit an issue](https://github.com/liangmiQwQ/vp-config/issues/new).

## License

[MIT](./LICENSE) License © 2026-PRESENT Liang

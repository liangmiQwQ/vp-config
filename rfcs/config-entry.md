# Config Entry

We have four categories of presets, they are designed for different kinds of projects.

`base` - pure and basic config, used for workspace or unclear projects.
`cli` - for cli and tui development
`lib` - for libraries which may be depended on by other projects.
`website` - for website development

Each category is exported as a named export.

```ts
import { base, cli, lib, website } from "@liangmi/vp-config";
```

They can be directly called as a function, as a wrapper of `defineConfig` from `vite-plus`, it receive one param just like `vite-plus`'s `defineConfig`, it can override the config in the preset and will be deeply merged.

```ts
import { base } from "@liangmi/vp-config";

export default base({ fmt: { semi: true } });
```

Since one preset can include multiple part (linting, formatting), these categories can also be treated as object, it has `.only` and `.exclude()` function, which receive strings to enable whitelist or blacklist mode, thereby achieving the goal of loading only certain configurations.

For example

```ts
import { base } from "@liangmi/vp-config";

export default base.only(["lint", "fmt"], {
  lint: {
    /* Your own linting config */
  },
  fmt: {
    /* Your own formatting config */
  },
});
```

# RFC: Tasks `cache` Config

Vite+'s cache task runner is a powerful system that allows you to save a lot of time, but it has some problems when configuring in real project.

- We can't enable cache for all tasks, some stdin-needed tasks should not be cached (like bumpp), the cacheable tasks are also usually certain ones, like `build`, `pack`, `check` and sometimes `test`.
- We aren't able to configure each script command, only tasks in `vite.config.ts` can be configured in detail.
- We can't configure all the tasks in `vite.config.ts`, npm's lifecycle tasks are still needed in `scripts`, while defining tasks in two different places seems confusing and not the best practice, it is also not so friendly to contributors who aren't using Vite+ global cli (they have to run `npx vp run <task>`).
- Even if we make up our mind to define tasks in `vite.config.ts`, there are still some configs that need to be done, like `vpr pack` (internal `vp pack`), we are supposed to set `output` to get build result cache while the data in config is usually enough to infer these information (Just like https://github.com/voidzero-dev/vite-plus/pull/1774).

Based on that, we do not enable global `cache` in `vite.config.ts`. Instead, we automatically generate Vite tasks whose name starts with `c` for cacheable tasks as a pure wrapper.

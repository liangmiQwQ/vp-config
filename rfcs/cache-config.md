# RFC: Tasks `cache` Config

Vite+'s cache task runner is a powerful system that allows you to save a lot of time, but it has some problems when configuring in real project.

- We can't enable cache for all tasks, some stdin-needed tasks should not be cached (like bumpp), the cacheable tasks are also usually certain ones, like `build`, `pack`, `check` and sometimes `test`.
- We aren't able to configure each script command, only tasks in `vite.config.ts` can be configured in detail.
- We can't configure all the tasks in `vite.config.ts`, npm's lifecycle tasks are still needed in `scripts`, while defining tasks in two different places seems confusing and not the best practice, it is also not so friendly to contributors who aren't using Vite+ global cli (they have to run `npx vp run <task>`, or define another alias in `package.json`).
- Even if we make up our mind to define tasks in `vite.config.ts`, there are still some configs that need to be done, like `vpr pack` (internal `vp pack`), we are supposed to set `output` to get build result cache while the data in config is usually enough to infer these information (Just like https://github.com/voidzero-dev/vite-plus/pull/1774).

Different from other task runner, Vite+ is a united toolchain for JavaScript development, it is able to control the internal tools, and the tools users run are also certain.

Based on that, we hope to have a command-level cache system, which means commands like `vp pack` itself can enable cache and find `output` directory, so that we do not need to configure and define all a task in `vite.config.ts`.

# RFC: Tasks `cache` Config

Vite+'s task run is a powerful system allows you to save a lot of time, but it has some problems in configuring in real project.

- We can't enable all tasks' cache, some stdin-needed tasks should not be cache (like bumpp).
- We aren't able to configure each script command, only tasks in `vite.config.ts` can be configured in detail.
- We can't configure all the tasks in `vite.config.ts`, npm's life hook tasks are still needed in `scripts`, while defining tasks in two different places seems confusing and not the best practice, it is also not so friendly to contributors who aren't using Vite+ global cli (they have to run `npx vpr <task>`).
- Even if we make up our mind to define tasks in `vite.config.ts`, there are still some configs need doing, like `vpr pack` (internal `vp pack`), we are supposed to setting `output` to get build result cache. It needs configuring manually. However, the data in config is usually enough to inffer these information.

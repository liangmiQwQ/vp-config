# RFC: Tasks `cache` Config

Vite+'s cache task runner is a powerful system that allows you to save a lot of time. But we need to configure it correctly and find the problems and universal modules for a universal vp config.

We are trying to solve these real world problems while configuring Vite+'s task runner, especially cache related difficulties.

- We can't enable cache for all tasks, some stdin-needed tasks should not be cached (like bumpp).
- Cacheable tasks are usually the typical ones, like `build`, `pack`, `check` and sometimes `test`, defining all of them as a pure wrapper (`vpr pack` -> `vp pack`) seems inefficient.
- We aren't able to configure each script in `package.json`, only tasks in `vite.config.ts` can be configured in detail.
- We can't configure all the tasks in `vite.config.ts`, npm's lifecycle tasks are still needed in `scripts`. But defining tasks in two different places seems confusing and not the best practice, it is also not so friendly to contributors who aren't using Vite+ global cli (they have to run `npx vp run <task>`, or define a nested, unstable command in `package.json`).
- Even if we decide to define tasks in `vite.config.ts`, there are still some configs that need to be done, like `vpr pack` (Command: `vp pack`), we are supposed to set `output` to get build result cache while the data in config is usually enough to infer these information (https://github.com/voidzero-dev/vite-plus/pull/1774 proves Vite+'s team).

Unlike other pure task runners, Vite+ is also a united toolchain. The commands users run are relatively certain and controllable, which gives us more room to optimize DX.

## Config-level solution: Tasks Autogen

Tasks autogen means automatically generating wrapper tasks for some common commands, which are configured and cache-enabled.

```markdown
`vp run cbuild` -> `vp build`
`vp run cpack` -> `vp pack`
```

Their names should start with `c` (a sign of `cached`). They should be treated more like cached versions of Vite+ commands rather than normal user-defined tasks. For example, users can run `vpr ccheck` as a cached replacement for `vp check`.

For now, we only generate commands without detailed config like `output`, it's considiering Vite+'s team's recent work (#1774) and to reduce duplicate work.

The core idea is to get **command level** cache ability. Since we cannot modify internal Vite+'s command implementation, we use a task wrapper as the cached replacements for original commands.

These ideas can help solve the problem in these aspect:

- We do not need to enable command's cache manually anymore.
- Cached commands won't be configured explicitly in `vite.config.ts`
- We can now define `"build": "vp run cpack"` in `package.json` without any duplicate configure, it also helps contributors who aren't using global Vite+ CLI.
- It provides ability to generate metadata like `output` (It has ability, but not planned to implement for now)

Personally, I am looking forward to seeing whether there might be further integration here. This idea might be worth subbmiting to upstream in the future.

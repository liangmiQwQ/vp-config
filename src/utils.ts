interface ConfigType {
  inWorkspace: boolean
  root: boolean
}

/**
 * Check whether a config is a nested config
 */
export function isProjectRoot(): ConfigType {
  // 1. Start from the current working directory (`cwd`).

  // 2. Walk up parent directories until a workspace marker is found.

  // 3. If `pnpm-workspace.yaml` exists, treat that directory as the workspace root.
  //    This means the project is a monorepo.

  // 4. Otherwise, if `package.json` exists and has a `workspaces` field,
  //    treat that directory as the workspace root.
  //    This also means the project is a monorepo.

  // 5. If no workspace marker is found, walk up to find the nearest `package.json`.
  //    That directory is treated as a normal standalone package root.

  // 6. If neither a workspace marker nor `package.json` is found,
  //    Vite+ treats the current location as not being inside a project.

  // 7. After the workspace root is found, Vite+ sets `isMonorepo = true` only when
  //    the root came from `pnpm-workspace.yaml` or `package.json#workspaces`.

  // 8. To find workspace packages, Vite+ reads the workspace patterns:
  //    `pnpm-workspace.yaml#packages` or `package.json#workspaces`.

  // 9. Those patterns are expanded to package paths by looking for matching
  //    `package.json` files.

  // 10. To decide the current sub-package, Vite+ walks up from `cwd` and checks
  //     which package path in the package graph contains it.
  return {} as ConfigType
}

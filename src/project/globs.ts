// Globs of a project are written relative to the project, and rebased to be relative to the workspace root.
export function rebaseGlobs(globs: string[], projectPath: string): string[] {
  return globs.map(glob => `${projectPath}/${glob}`)
}

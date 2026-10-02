import type { UserConfig } from 'vite-plus'

// `index.html` decides the browser runtime, but its existence check is not tracked automatically.
const lintInput = [{ auto: true }, 'index.html']

export const runBase: NonNullable<UserConfig['run']> = {
  tasks: {
    cbuild: 'vp build',
    ccheck: { command: 'vp check', cache: { input: lintInput } },
    cfmt: 'vp fmt',
    cformat: 'vp format',
    clint: { command: 'vp lint', cache: { input: lintInput } },
    cpack: 'vp pack',
    ctest: 'vp test'
  }
}

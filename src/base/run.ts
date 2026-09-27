import type { UserConfig } from 'vite-plus'

const lintInput = [{ auto: true }, '!**/node_modules/.vp-config/info.json', 'index.html']

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

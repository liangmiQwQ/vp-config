import type { UserConfig } from 'vite-plus'

export const run: NonNullable<UserConfig['run']> = {
  tasks: {
    cbuild: 'vp build',
    ccheck: { command: 'vp check', input: ['!node_modules/.vp-config/info.json'] },
    cfmt: 'vp fmt',
    cformat: 'vp format',
    clint: { command: 'vp lint', input: ['!node_modules/.vp-config/info.json'] },
    cpack: 'vp pack',
    ctest: 'vp test'
  }
}

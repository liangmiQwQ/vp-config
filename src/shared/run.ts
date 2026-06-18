import type { UserConfig } from 'vite-plus'

export const run: NonNullable<UserConfig['run']> = {
  tasks: {
    cbuild: 'vp build',
    ccheck: 'vp check',
    cfmt: 'vp fmt',
    cformat: 'vp format',
    clint: 'vp lint',
    cpack: 'vp pack',
    ctest: 'vp test'
  }
}

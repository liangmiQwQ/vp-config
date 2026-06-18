import type { UserConfig } from 'vite-plus'

const lintInput = ['!node_modules/.vp-config/info.json', 'index.html']

export const runBase: NonNullable<UserConfig['run']> = {
  tasks: {
    cbuild: 'vp build',
    ccheck: { command: 'vp check', input: lintInput },
    cfmt: 'vp fmt',
    cformat: 'vp format',
    clint: { command: 'vp lint', input: lintInput },
    cpack: 'vp pack',
    ctest: 'vp test'
  },
  cache: {
    scripts: false,
    tasks: true
  }
}

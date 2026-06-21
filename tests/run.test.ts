import { expect, it } from 'vite-plus/test'

import { base, cli, lib, website } from '../src/index.ts'

it('should include shared tasks in every preset category', () => {
  for (const config of [base, cli, lib, website]) {
    const tasks = config({}).run?.tasks

    for (const task of ['cbuild', 'ccheck', 'cfmt', 'cformat', 'clint', 'cpack', 'ctest']) {
      expect(tasks).toHaveProperty(task)
    }
  }
})

import { expect, it } from 'vite-plus/test'

import { base, cli, lib, website } from '../src/index.ts'

it('should include shared staged config in every preset category', () => {
  for (const config of [base, cli, lib, website]) {
    expect(config({}).staged).toMatchObject({
      '*': 'vp check --fix'
    })
  }
})

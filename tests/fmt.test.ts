import { expect, it } from 'vite-plus/test'

import { website } from '../src/index.ts'

it('should enable embedded language formatting for website projects', () => {
  expect(website({}).fmt).toMatchObject({
    embeddedLanguageFormatting: 'auto'
  })
})

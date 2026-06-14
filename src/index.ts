import { baseConfig } from './base/index.ts'
import { cliConfig } from './cli/index.ts'
import { createConfigEntry } from './entry.ts'
import { libConfig } from './lib/index.ts'
import { websiteConfig } from './website/index.ts'

const base = createConfigEntry(baseConfig, 'base')
const cli = createConfigEntry(cliConfig, 'cli')
const lib = createConfigEntry(libConfig, 'lib')
// WIP, incomplete. Waiting for Oxlint's better Vue support
const website = createConfigEntry(websiteConfig, 'website')

export { base, cli, lib, website }

import { baseConfig } from './base/index.ts'
import { cliConfig } from './cli/index.ts'
import { createConfigEntry } from './entry.ts'
import { libConfig } from './lib/index.ts'
import { websiteConfig } from './website/index.ts'

const base = createConfigEntry(baseConfig)
const cli = createConfigEntry(cliConfig)
const lib = createConfigEntry(libConfig)
// WIP, incomplete. Waiting for Oxlint's better Vue support
const website = createConfigEntry(websiteConfig)

export { base, cli, lib, website }

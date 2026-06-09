import { fmtBase } from './base/fmt.ts'
import { createConfigEntry } from './entry.ts'

const presetConfig = {
  fmt: fmtBase
}

const base = createConfigEntry(presetConfig)
const cli = base
const lib = base
// Waiting for Oxlint's better Vue support
const website = base

export { base, cli, lib, website }

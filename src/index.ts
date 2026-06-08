import { createConfigEntry } from "./entry.ts";

const base = createConfigEntry({});
const cli = base;
const lib = base;
// Waiting for Oxlint's better Vue support
const website = base;

export { base, cli, lib, website };

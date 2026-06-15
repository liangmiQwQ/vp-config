import type { UserConfig } from 'vite-plus/pack'

export const packCli: UserConfig = {
  dts: false,
  minify: true,
  platform: 'node',
  nodeProtocol: 'strip'
}

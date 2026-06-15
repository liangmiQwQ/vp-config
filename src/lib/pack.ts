import type { UserConfig } from 'vite-plus/pack'

export const packLib: UserConfig = {
  fixedExtension: true,
  exports: true,
  dts: {
    tsgo: true
  }
}

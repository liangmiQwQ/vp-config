import type { UserConfig } from 'vite-plus'

export const stagedBase: NonNullable<UserConfig['staged']> = {
  '*': 'vp check --fix'
}

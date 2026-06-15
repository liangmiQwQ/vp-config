import type { UserConfig } from 'vite-plus'

export const staged: NonNullable<UserConfig['staged']> = {
  '*': 'vp check --fix'
}

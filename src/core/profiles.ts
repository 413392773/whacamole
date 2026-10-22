import { BUILTIN_AVATARS } from '../config/avatars'
import type { GameConfig, MoleProfile } from './types'

export function getEffectiveProfiles(config: GameConfig): MoleProfile[] {
  if (config.profiles.length > 0) return config.profiles
  return BUILTIN_AVATARS.map((emoji, index) => ({
    id: `builtin-${index}`,
    name: '',
    emoji,
  }))
}

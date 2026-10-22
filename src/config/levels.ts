import type { LevelConfig } from '../core/types'

export const GRID_ROWS = 3
export const GRID_COLS = 4
export const HOLE_COUNT = GRID_ROWS * GRID_COLS
export const ATTEMPTS_PER_LEVEL = 3
export const LEVEL_COUNT = 5
export const MIN_BASE_MOLE_COUNT = 1
export const MAX_BASE_MOLE_COUNT = 4
export const DEFAULT_BASE_MOLE_COUNT = 2
export const MAX_PROFILES = 10
export const MAX_NAME_LENGTH = 6
export const MAX_PLAYER_NAME_LENGTH = 12
export const DEFAULT_PLAYER_NAME = '无名勇士'

export const LEVELS: readonly LevelConfig[] = [
  { level: 1, title: '小试牛刀', multiplier: 1.0, durationMs: 30_000, stayMs: 1600, spawnIntervalMs: 900, accuracyTarget: 0.3 },
  { level: 2, title: '加速来袭', multiplier: 1.5, durationMs: 30_000, stayMs: 1400, spawnIntervalMs: 800, accuracyTarget: 0.5 },
  { level: 3, title: '狂乱时刻', multiplier: 2.0, durationMs: 30_000, stayMs: 1200, spawnIntervalMs: 700, accuracyTarget: 0.6 },
  { level: 4, title: '幻影闪现', multiplier: 2.5, durationMs: 30_000, stayMs: 1000, spawnIntervalMs: 600, accuracyTarget: 0.7 },
  { level: 5, title: '鼠神决战', multiplier: 3.0, durationMs: 30_000, stayMs: 850, spawnIntervalMs: 500, accuracyTarget: 0.8 },
]

export function simultaneousMoles(baseMoleCount: number, level: LevelConfig): number {
  const count = Math.round(baseMoleCount * level.multiplier)
  return Math.min(HOLE_COUNT, Math.max(1, count))
}

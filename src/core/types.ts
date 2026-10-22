export type Screen = 'setup' | 'intro' | 'playing' | 'result' | 'gameover' | 'certificate'

export interface MoleProfile {
  id: string
  name: string
  avatarDataUrl?: string
  emoji?: string
}

export interface GameConfig {
  playerName: string
  baseMoleCount: number
  profiles: MoleProfile[]
}

export interface LevelConfig {
  readonly level: number
  readonly title: string
  readonly multiplier: number
  readonly durationMs: number
  readonly stayMs: number
  readonly spawnIntervalMs: number
  readonly accuracyTarget: number
}

export type MoleState = 'rising' | 'up' | 'hit' | 'escaped'

export interface Mole {
  id: number
  holeIndex: number
  profileId: string
  state: MoleState
  spawnedAt: number
  resolvedAt?: number
}

export interface LevelStats {
  hits: number
  spawned: number
  misses: number
  score: number
  maxCombo: number
  accuracy: number
}

export interface GameState {
  screen: Screen
  config: GameConfig
  levelIndex: number
  attemptsLeft: number
  clearedLevels: number
  levelAccuracies: number[]
  levelStartAt: number
  nextSpawnAt: number
  moleIdSeq: number
  moles: Mole[]
  stats: LevelStats
  combo: number
  totalScore: number
  lastLevelPassed: boolean
}

export type Action =
  | { type: 'START_GAME'; config: GameConfig }
  | { type: 'BEGIN_LEVEL'; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'WHACK'; moleId: number; now: number }
  | { type: 'WHIFF' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'RETRY_LEVEL' }
  | { type: 'RESTART' }
  | { type: 'DEBUG_JUMP_LEVEL'; levelIndex: number }
  | { type: 'DEBUG_CLEAR_ALL' }

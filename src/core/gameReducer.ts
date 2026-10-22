import { ATTEMPTS_PER_LEVEL, HOLE_COUNT, LEVELS, simultaneousMoles } from '../config/levels'
import { getEffectiveProfiles } from './profiles'
import { accuracy, hasPassed, hitScore } from './scoring'
import { tickSpawns } from './spawnEngine'
import type { Action, GameConfig, GameState, LevelConfig, LevelStats } from './types'

export function emptyStats(): LevelStats {
  return { hits: 0, spawned: 0, misses: 0, score: 0, maxCombo: 0, accuracy: 0 }
}

export function createInitialState(config: GameConfig): GameState {
  return {
    screen: 'setup',
    config,
    levelIndex: 0,
    attemptsLeft: ATTEMPTS_PER_LEVEL,
    clearedLevels: 0,
    levelAccuracies: [],
    levelStartAt: 0,
    nextSpawnAt: 0,
    moleIdSeq: 1,
    moles: [],
    stats: emptyStats(),
    combo: 0,
    totalScore: 0,
    lastLevelPassed: false,
  }
}

function finishLevel(state: GameState, level: LevelConfig): GameState {
  const stillActive = state.moles.filter((mole) => mole.resolvedAt === undefined)
  const stats: LevelStats = {
    ...state.stats,
    misses: state.stats.misses + stillActive.length,
  }
  const acc = accuracy(stats.hits, stats.spawned)
  const withAccuracy: LevelStats = { ...stats, accuracy: acc }
  const passed = hasPassed(acc, level.accuracyTarget)
  const base: GameState = { ...state, stats: withAccuracy, combo: 0, moles: [] }

  if (passed) {
    return {
      ...base,
      screen: 'result',
      lastLevelPassed: true,
      clearedLevels: state.clearedLevels + 1,
      levelAccuracies: [...state.levelAccuracies, acc],
      totalScore: state.totalScore + withAccuracy.score,
    }
  }
  const attemptsLeft = state.attemptsLeft - 1
  if (attemptsLeft > 0) {
    return { ...base, screen: 'result', lastLevelPassed: false, attemptsLeft }
  }
  return { ...base, screen: 'gameover', lastLevelPassed: false, attemptsLeft: 0 }
}

export function createGameReducer(random: () => number) {
  return function gameReducer(state: GameState, action: Action): GameState {
    switch (action.type) {
      case 'START_GAME':
        return { ...createInitialState(action.config), screen: 'intro' }

      case 'BEGIN_LEVEL':
        if (state.screen !== 'intro') return state
        return {
          ...state,
          screen: 'playing',
          levelStartAt: action.now,
          nextSpawnAt: action.now,
          moleIdSeq: 1,
          moles: [],
          stats: emptyStats(),
          combo: 0,
        }

      case 'TICK': {
        if (state.screen !== 'playing') return state
        const level = LEVELS[state.levelIndex]
        const snapshot = tickSpawns(
          {
            moles: state.moles,
            nextSpawnAt: state.nextSpawnAt,
            moleIdSeq: state.moleIdSeq,
            spawned: state.stats.spawned,
            misses: state.stats.misses,
          },
          action.now,
          level,
          simultaneousMoles(state.config.baseMoleCount, level),
          HOLE_COUNT,
          getEffectiveProfiles(state.config),
          random,
        )
        const nextState: GameState = {
          ...state,
          moles: snapshot.moles,
          nextSpawnAt: snapshot.nextSpawnAt,
          moleIdSeq: snapshot.moleIdSeq,
          stats: { ...state.stats, spawned: snapshot.spawned, misses: snapshot.misses },
        }
        const timedUp = action.now - state.levelStartAt >= level.durationMs
        return timedUp ? finishLevel(nextState, level) : nextState
      }

      case 'WHACK': {
        if (state.screen !== 'playing') return state
        const target = state.moles.find((mole) => mole.id === action.moleId)
        if (target === undefined || target.resolvedAt !== undefined) return state
        const level = LEVELS[state.levelIndex]
        const combo = state.combo + 1
        const gained = hitScore(level.level, combo)
        return {
          ...state,
          combo,
          moles: state.moles.map((mole) =>
            mole.id === action.moleId
              ? { ...mole, state: 'hit' as const, resolvedAt: action.now }
              : mole,
          ),
          stats: {
            ...state.stats,
            hits: state.stats.hits + 1,
            score: state.stats.score + gained,
            maxCombo: Math.max(state.stats.maxCombo, combo),
          },
        }
      }

      case 'WHIFF':
        if (state.screen !== 'playing' || state.combo === 0) return state
        return { ...state, combo: 0 }

      case 'NEXT_LEVEL': {
        if (state.screen !== 'result' || !state.lastLevelPassed) return state
        if (state.levelIndex >= LEVELS.length - 1) return { ...state, screen: 'certificate' }
        return {
          ...state,
          screen: 'intro',
          levelIndex: state.levelIndex + 1,
          attemptsLeft: ATTEMPTS_PER_LEVEL,
        }
      }

      case 'RETRY_LEVEL':
        if (state.screen !== 'result' || state.lastLevelPassed || state.attemptsLeft <= 0) return state
        return { ...state, screen: 'intro' }

      case 'RESTART':
        return createInitialState(state.config)

      case 'DEBUG_JUMP_LEVEL': {
        const index = Math.min(LEVELS.length - 1, Math.max(0, action.levelIndex))
        return { ...state, screen: 'intro', levelIndex: index, attemptsLeft: ATTEMPTS_PER_LEVEL }
      }

      case 'DEBUG_CLEAR_ALL':
        return {
          ...state,
          screen: 'certificate',
          clearedLevels: LEVELS.length,
          levelAccuracies: LEVELS.map(() => 1),
          totalScore: Math.max(state.totalScore, 1500),
        }

      default:
        return state
    }
  }
}

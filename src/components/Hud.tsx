import type { GameState } from '../core/types'
import { ATTEMPTS_PER_LEVEL, LEVELS } from '../config/levels'
import { accuracy } from '../core/scoring'

const RING_RADIUS = 17
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface Props {
  state: GameState
  now: number
}

export function Hud({ state, now }: Props) {
  const level = LEVELS[state.levelIndex]
  const remainingMs = Math.max(0, level.durationMs - (now - state.levelStartAt))
  const seconds = Math.ceil(remainingMs / 1000)
  const fraction = remainingMs / level.durationMs
  const acc = accuracy(state.stats.hits, state.stats.spawned)
  const accOk = state.stats.spawned > 0 && acc >= level.accuracyTarget
  const hearts =
    '❤️'.repeat(state.attemptsLeft) + '🖤'.repeat(ATTEMPTS_PER_LEVEL - state.attemptsLeft)

  return (
    <div className="hud">
      <div className="ring-wrap">
        <svg width="52" height="52" viewBox="0 0 40 40">
          <circle className="ring-bg" cx="20" cy="20" r={RING_RADIUS} />
          <circle
            className="ring-fg"
            cx="20" cy="20" r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
          />
        </svg>
        <div className="seconds">{seconds}</div>
      </div>
      <div className="stat">得分 {state.stats.score}</div>
      <div className={`stat accuracy ${accOk ? 'ok' : 'bad'}`}>
        命中率 {state.stats.spawned > 0 ? `${Math.round(acc * 100)}%` : '--'}
      </div>
      <div className="hearts">{hearts}</div>
    </div>
  )
}

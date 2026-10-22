import { useEffect, useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { ATTEMPTS_PER_LEVEL, LEVELS, simultaneousMoles } from '../config/levels'

const COUNTDOWN_SECONDS = 3
const COUNTDOWN_INTERVAL_MS = 1000

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function LevelIntro({ state, dispatch }: Props) {
  const level = LEVELS[state.levelIndex]
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS)

  useEffect(() => {
    if (remaining <= 0) {
      dispatch({ type: 'BEGIN_LEVEL', now: performance.now() })
      return
    }
    const timer = window.setTimeout(() => setRemaining((n) => n - 1), COUNTDOWN_INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [remaining, dispatch])

  const hearts =
    '❤️'.repeat(state.attemptsLeft) + '🖤'.repeat(ATTEMPTS_PER_LEVEL - state.attemptsLeft)

  return (
    <div className="intro">
      <div>第 {level.level} 关 / 共 5 关</div>
      <div className="level-name">{level.title}</div>
      <div className="params">
        同屏地鼠 {simultaneousMoles(state.config.baseMoleCount, level)} 只<br />
        限时 {level.durationMs / 1000} 秒 · 命中率 ≥ {Math.round(level.accuracyTarget * 100)}%
      </div>
      <div className="hearts">{hearts}</div>
      <div className="countdown" key={remaining}>
        {remaining > 0 ? remaining : '开始!'}
      </div>
    </div>
  )
}

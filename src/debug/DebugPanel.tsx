import { useEffect, useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { LEVELS } from '../config/levels'

const GOD_MODE_INTERVAL_MS = 200

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function DebugPanel({ state, dispatch }: Props) {
  const [isGodMode, setIsGodMode] = useState(false)

  useEffect(() => {
    if (!isGodMode || state.screen !== 'playing') return
    const timer = window.setInterval(() => {
      const target = state.moles.find(
        (mole) => mole.state === 'rising' || mole.state === 'up',
      )
      if (target !== undefined) {
        dispatch({ type: 'WHACK', moleId: target.id, now: performance.now() })
      }
    }, GOD_MODE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isGodMode, state.screen, state.moles, dispatch])

  return (
    <div className="debug-panel">
      <span>
        {state.screen} · L{state.levelIndex + 1} · ❤{state.attemptsLeft} ·
        acc {state.stats.spawned > 0 ? Math.round((state.stats.hits / state.stats.spawned) * 100) : 0}%
      </span>
      {LEVELS.map((level, index) => (
        <button key={level.level} onClick={() => dispatch({ type: 'DEBUG_JUMP_LEVEL', levelIndex: index })}>
          关{level.level}
        </button>
      ))}
      <button onClick={() => dispatch({ type: 'DEBUG_CLEAR_ALL' })}>跳证书</button>
      <button onClick={() => setIsGodMode((value) => !value)}>
        {isGodMode ? '上帝:开' : '上帝:关'}
      </button>
    </div>
  )
}

import { useEffect } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { ATTEMPTS_PER_LEVEL, LEVELS } from '../config/levels'
import { playSound } from '../hooks/useSound'

const CONFETTI_COUNT = 24
const CONFETTI_COLORS = ['#ff6b35', '#ffd166', '#2a9d3f', '#4d96ff', '#e63946']

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function LevelResult({ state, dispatch }: Props) {
  const level = LEVELS[state.levelIndex]
  const passed = state.lastLevelPassed

  useEffect(() => {
    playSound(passed ? 'pass' : 'fail')
  }, [passed])

  const gapPercent = Math.max(
    0,
    Math.ceil((level.accuracyTarget - state.stats.accuracy) * 100),
  )
  const hearts =
    '❤️'.repeat(state.attemptsLeft) + '🖤'.repeat(ATTEMPTS_PER_LEVEL - state.attemptsLeft)

  return (
    <div className="result">
      {passed && (
        <>
          {Array.from({ length: CONFETTI_COUNT }, (_, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                left: `${(index * 97) % 100}%`,
                background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                animationDelay: `${(index % 8) * 0.12}s`,
              }}
            />
          ))}
          <div className="big">🎉 过关！</div>
        </>
      )}
      {!passed && <div className="big">💪 差一点点！</div>}

      <div className="panel stats-list">
        <div>{level.title} · 第 {level.level} 关</div>
        <div>
          命中率 {Math.round(state.stats.accuracy * 100)}%
          {!passed && <span className="gap-hint">（达标 {Math.round(level.accuracyTarget * 100)}%，还差 {gapPercent}%）</span>}
        </div>
        <div>敲中 {state.stats.hits} / 冒出 {state.stats.spawned}</div>
        <div>本关得分 {state.stats.score} · 最高 Combo ×{state.stats.maxCombo}</div>
        {!passed && <div className="hearts">剩余机会 {hearts}</div>}
      </div>

      {passed ? (
        <button onClick={() => dispatch({ type: 'NEXT_LEVEL' })}>
          {state.levelIndex >= LEVELS.length - 1 ? '领取荣誉证书' : '下一关'}
        </button>
      ) : (
        <button onClick={() => dispatch({ type: 'RETRY_LEVEL' })}>重试本关</button>
      )}
    </div>
  )
}

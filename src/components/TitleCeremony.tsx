import { useEffect } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { getTitle } from '../config/titles'
import { LEVELS } from '../config/levels'
import { playSound } from '../hooks/useSound'

const STAMP_SOUND_DELAY_MS = 300

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function TitleCeremony({ state, dispatch }: Props) {
  const title = getTitle(state.clearedLevels)

  useEffect(() => {
    const timer = window.setTimeout(() => playSound('stamp'), STAMP_SOUND_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="ceremony">
      <div className="spotlight" />
      <div className="panel">
        <div>侠士 <strong>{state.config.playerName}</strong> 荣获称号</div>
        <span className="badge">{title.emoji}</span>
        <div className="badge-name">{title.name}</div>
        <div className="badge-quote">{title.quote}</div>
        <div>
          通过 {state.clearedLevels} / {LEVELS.length} 关 · 总得分 {state.totalScore}
        </div>
      </div>
      <button onClick={() => dispatch({ type: 'RESTART' })}>再来一局</button>
    </div>
  )
}

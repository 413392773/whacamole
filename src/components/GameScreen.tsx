import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { useGameLoop } from '../hooks/useGameLoop'
import { playSound } from '../hooks/useSound'
import { buzz } from '../hooks/useHaptics'
import { Hud } from './Hud'
import { GameBoard } from './GameBoard'
import { ComboFx } from './ComboFx'

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function GameScreen({ state, dispatch }: Props) {
  const [now, setNow] = useState(() => performance.now())
  const prevHits = useRef(state.stats.hits)
  const prevMisses = useRef(state.stats.misses)

  useGameLoop(true, dispatch)

  useEffect(() => {
    // 每帧刷新显示层 now（HUD 倒计时环 / WHACK 时间戳）；
    // 记录最新 frame id，卸载时取消整条递归链，避免泄漏
    let frame = 0
    const loop = () => {
      setNow(performance.now())
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (state.stats.hits > prevHits.current) {
      playSound('whack', state.combo)
      buzz(30)
    }
    prevHits.current = state.stats.hits
  }, [state.stats.hits, state.combo])

  useEffect(() => {
    if (state.stats.misses > prevMisses.current) playSound('escape')
    prevMisses.current = state.stats.misses
  }, [state.stats.misses])

  return (
    <div>
      <Hud state={state} now={now} />
      <GameBoard state={state} dispatch={dispatch} now={now} />
      <ComboFx state={state} />
    </div>
  )
}

import { useEffect } from 'react'
import type { Dispatch } from 'react'
import type { Action } from '../core/types'

export function useGameLoop(active: boolean, dispatch: Dispatch<Action>): void {
  useEffect(() => {
    if (!active) return
    let frame = 0
    const loop = () => {
      // 先排下一帧再 dispatch：即使 dispatch 抛异常，循环也不会静默死亡
      frame = requestAnimationFrame(loop)
      dispatch({ type: 'TICK', now: performance.now() })
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [active, dispatch])
}

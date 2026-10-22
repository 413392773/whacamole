import { useEffect } from 'react'
import type { Dispatch } from 'react'
import type { Action } from '../core/types'

export function useGameLoop(active: boolean, dispatch: Dispatch<Action>): void {
  useEffect(() => {
    if (!active) return
    let frame = 0
    const loop = () => {
      dispatch({ type: 'TICK', now: performance.now() })
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [active, dispatch])
}

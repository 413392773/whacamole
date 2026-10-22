// 占位组件，Task 16 替换为完整实现
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function DebugPanel({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  return (
    <div className="debug-panel">
      <span>debug:{state.screen}</span>
      <button onClick={() => dispatch({ type: 'DEBUG_CLEAR_ALL' })}>跳证书</button>
    </div>
  )
}

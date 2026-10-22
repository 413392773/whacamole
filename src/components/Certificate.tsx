// 占位组件，Task 15 替换为完整实现
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function Certificate({ state }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>证书：{state.config.playerName}</div>
}

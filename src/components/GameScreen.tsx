// 占位组件，Task 12 替换为完整实现
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function GameScreen({ state }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>游戏中：{state.stats.spawned}</div>
}

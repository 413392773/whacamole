// 占位组件，Task 14 替换为完整实现
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function TitleCeremony({ state }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>授衔：{state.clearedLevels}</div>
}

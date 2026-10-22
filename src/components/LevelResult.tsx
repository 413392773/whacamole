// 占位组件，Task 13 替换为完整实现
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function LevelResult({ state }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>{state.lastLevelPassed ? '达标' : '未达标'}</div>
}

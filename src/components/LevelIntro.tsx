// 占位组件，Task 11 替换为完整实现
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function LevelIntro({ state }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>第 {state.levelIndex + 1} 关</div>
}

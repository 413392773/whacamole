// 占位组件，Task 10 替换为完整实现
import type { Dispatch } from 'react'
import type { Action, GameConfig } from '../core/types'

export function SetupScreen({ initialConfig, dispatch }: {
  initialConfig: GameConfig
  dispatch: Dispatch<Action>
}) {
  return <button onClick={() => dispatch({ type: 'START_GAME', config: initialConfig })}>开始游戏</button>
}

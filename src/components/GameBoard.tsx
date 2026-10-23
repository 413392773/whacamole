import { useMemo } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { HOLE_COUNT } from '../config/levels'
import { getEffectiveProfiles } from '../core/profiles'
import { MoleHole } from './MoleHole'

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
  now: number
}

export function GameBoard({ state, dispatch, now }: Props) {
  // 每帧 tick 都会重渲染，缓存派生数组避免无谓重建
  const profiles = useMemo(() => getEffectiveProfiles(state.config), [state.config])
  const holes = Array.from({ length: HOLE_COUNT }, (_, holeIndex) => holeIndex)

  return (
    <div className="board">
      {holes.map((holeIndex) => (
        <MoleHole
          key={holeIndex}
          holeIndex={holeIndex}
          mole={state.moles.find((mole) => mole.holeIndex === holeIndex)}
          profiles={profiles}
          dispatch={dispatch}
          now={now}
        />
      ))}
    </div>
  )
}

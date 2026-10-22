import type { GameState } from '../core/types'

const COMBO_DISPLAY_THRESHOLD = 3

export function ComboFx({ state }: { state: GameState }) {
  if (state.combo < COMBO_DISPLAY_THRESHOLD) return null
  return (
    <div className="combo-fx" key={state.stats.hits}>
      Combo ×{state.combo}
    </div>
  )
}

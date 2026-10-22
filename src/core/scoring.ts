export const BASE_HIT_SCORE = 10
export const COMBO_BONUS_STEP = 5
export const COMBO_THRESHOLD = 3

export function comboBonus(combo: number): number {
  return combo >= COMBO_THRESHOLD ? COMBO_BONUS_STEP * (combo - (COMBO_THRESHOLD - 1)) : 0
}

export function hitScore(level: number, combo: number): number {
  return BASE_HIT_SCORE * level + comboBonus(combo)
}

export function accuracy(hits: number, spawned: number): number {
  return spawned === 0 ? 0 : hits / spawned
}

export function hasPassed(accuracyValue: number, target: number): boolean {
  return accuracyValue >= target
}

export function averageAccuracy(perLevelAccuracies: readonly number[]): number {
  if (perLevelAccuracies.length === 0) return 0
  const sum = perLevelAccuracies.reduce((total, value) => total + value, 0)
  return sum / perLevelAccuracies.length
}

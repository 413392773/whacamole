export function comboBonus(combo: number): number {
  return combo >= 3 ? 5 * (combo - 2) : 0
}

export function hitScore(level: number, combo: number): number {
  return 10 * level + comboBonus(combo)
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

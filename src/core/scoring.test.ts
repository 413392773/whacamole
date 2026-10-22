import { hitScore, accuracy, hasPassed, averageAccuracy } from './scoring'

test('命中基础分 = 10×关卡数', () => {
  expect(hitScore(1, 1)).toBe(10)
  expect(hitScore(3, 2)).toBe(30)
})

test('Combo≥3 额外加分 5×(combo−2)', () => {
  expect(hitScore(1, 3)).toBe(10 + 5)
  expect(hitScore(2, 5)).toBe(20 + 15)
})

test('命中率 = 命中÷冒出，0 冒出记 0', () => {
  expect(accuracy(3, 4)).toBeCloseTo(0.75)
  expect(accuracy(0, 0)).toBe(0)
  expect(accuracy(5, 5)).toBe(1)
})

test('达标判定含等于', () => {
  expect(hasPassed(0.5, 0.5)).toBe(true)
  expect(hasPassed(0.4999, 0.5)).toBe(false)
})

test('平均命中率为算术平均，空数组记 0', () => {
  expect(averageAccuracy([0.8, 0.6])).toBeCloseTo(0.7)
  expect(averageAccuracy([])).toBe(0)
})

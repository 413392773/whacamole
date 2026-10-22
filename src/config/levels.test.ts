import { LEVELS, simultaneousMoles, ATTEMPTS_PER_LEVEL, HOLE_COUNT } from './levels'

test('共 5 关且达标线递增、停留时间递减', () => {
  expect(LEVELS).toHaveLength(5)
  for (let i = 1; i < LEVELS.length; i++) {
    expect(LEVELS[i].accuracyTarget).toBeGreaterThan(LEVELS[i - 1].accuracyTarget)
    expect(LEVELS[i].stayMs).toBeLessThan(LEVELS[i - 1].stayMs)
  }
})

test('同屏只数 = round(基础值×倍数)，且 1~12 封顶', () => {
  expect(simultaneousMoles(2, LEVELS[0])).toBe(2)
  expect(simultaneousMoles(2, LEVELS[1])).toBe(3)
  expect(simultaneousMoles(2, LEVELS[4])).toBe(6)
  expect(simultaneousMoles(4, LEVELS[4])).toBe(HOLE_COUNT)
  expect(simultaneousMoles(1, LEVELS[1])).toBeGreaterThanOrEqual(1)
})

test('每关 3 次机会（含首次）', () => {
  expect(ATTEMPTS_PER_LEVEL).toBe(3)
})

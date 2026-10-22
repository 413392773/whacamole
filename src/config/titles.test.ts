import { getTitle, getRank } from './titles'

test('通过 0~5 关对应六档称号', () => {
  expect(getTitle(0).name).toBe('初入江湖')
  expect(getTitle(1).name).toBe('小有名气')
  expect(getTitle(2).name).toBe('身手敏捷')
  expect(getTitle(3).name).toBe('弹无虚发')
  expect(getTitle(4).name).toBe('一代宗师')
  expect(getTitle(5).name).toBe('武林鼠神')
})

test('越界值收敛到合法档位', () => {
  expect(getTitle(-1).name).toBe('初入江湖')
  expect(getTitle(99).name).toBe('武林鼠神')
})

test('证书评级阈值与兜底', () => {
  expect(getRank(0.95).grade).toBe('S')
  expect(getRank(0.9).grade).toBe('S')
  expect(getRank(0.85).grade).toBe('A')
  expect(getRank(0.8).grade).toBe('A')
  expect(getRank(0.75).grade).toBe('B')
  expect(getRank(0.7).grade).toBe('B')
  expect(getRank(0.58).grade).toBe('C')
  expect(getRank(0).grade).toBe('C')
})

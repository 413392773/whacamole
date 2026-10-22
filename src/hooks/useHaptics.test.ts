import { buzz } from './useHaptics'

test('支持 vibrate 时按 pattern 震动', () => {
  const vibrate = vi.fn()
  vi.stubGlobal('navigator', { ...navigator, vibrate })
  buzz(30)
  expect(vibrate).toHaveBeenCalledWith(30)
  vi.unstubAllGlobals()
})

test('不支持 vibrate 时静默降级不抛错', () => {
  vi.stubGlobal('navigator', { ...navigator, vibrate: undefined })
  expect(() => buzz(30)).not.toThrow()
  vi.unstubAllGlobals()
})

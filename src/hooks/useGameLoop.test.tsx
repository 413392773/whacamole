import { renderHook } from '@testing-library/react'
import type { Dispatch } from 'react'
import { useGameLoop } from './useGameLoop'
import type { Action } from '../core/types'

afterEach(() => vi.unstubAllGlobals())

test('激活时按帧派发 TICK，停止后取消', () => {
  let rafCallback: FrameRequestCallback | null = null
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    rafCallback = cb
    return 1
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('performance', { now: () => 42 })

  const dispatch = vi.fn()
  const { unmount } = renderHook(() => useGameLoop(true, dispatch as unknown as Dispatch<Action>))
  expect(rafCallback).not.toBeNull()
  rafCallback!(0)
  expect(dispatch).toHaveBeenCalledWith({ type: 'TICK', now: 42 })
  unmount()
  expect(cancelAnimationFrame).toHaveBeenCalled()
})

test('未激活时不启动循环', () => {
  const raf = vi.fn()
  vi.stubGlobal('requestAnimationFrame', raf)
  const dispatch = vi.fn()
  renderHook(() => useGameLoop(false, dispatch as unknown as Dispatch<Action>))
  expect(raf).not.toHaveBeenCalled()
})

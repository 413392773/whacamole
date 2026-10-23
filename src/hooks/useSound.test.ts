import type { Mock } from 'vitest'

interface FakeOscillator {
  type: string
  frequency: { setValueAtTime: Mock }
  connect: Mock
  start: Mock
  stop: Mock
}

interface StubResult {
  readonly oscillators: FakeOscillator[]
  readonly contexts: unknown[]
}

function stubAudioContext(options: { state?: string; ctorThrows?: boolean } = {}): StubResult {
  const oscillators: FakeOscillator[] = []
  const contexts: unknown[] = []

  class FakeAudioContext {
    state = options.state ?? 'running'
    currentTime = 0
    destination = {}
    resume = vi.fn(() => Promise.resolve())

    constructor() {
      if (options.ctorThrows) throw new Error('no audio device')
      contexts.push(this)
    }

    createOscillator(): FakeOscillator {
      const osc: FakeOscillator = {
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
      oscillators.push(osc)
      return osc
    }

    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }
    }
  }

  vi.stubGlobal('AudioContext', FakeAudioContext)
  return { oscillators, contexts }
}

// useSound 模块级缓存 AudioContext 单例，每个测试重新加载保证隔离
async function loadUseSound(): Promise<typeof import('./useSound')> {
  vi.resetModules()
  return await import('./useSound')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

test('AudioContext 不存在时 playSound 静默降级不抛错', async () => {
  vi.stubGlobal('AudioContext', undefined)
  const { playSound } = await loadUseSound()
  expect(() => playSound('whack')).not.toThrow()
})

test('AudioContext 构造异常时静默降级不抛错', async () => {
  stubAudioContext({ ctorThrows: true })
  const { playSound } = await loadUseSound()
  expect(() => playSound('whack')).not.toThrow()
})

test('playSound("whack") 调度 1 个方波振荡器并完成 start/stop', async () => {
  const { oscillators } = stubAudioContext()
  const { playSound } = await loadUseSound()
  playSound('whack')
  expect(oscillators).toHaveLength(1)
  const osc = oscillators[0]
  expect(osc.type).toBe('square')
  expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(300, 0)
  expect(osc.start).toHaveBeenCalledTimes(1)
  expect(osc.stop).toHaveBeenCalledTimes(1)
})

test('combo 抬高敲击音高，且封顶 10 档', async () => {
  const { oscillators } = stubAudioContext()
  const { playSound } = await loadUseSound()
  playSound('whack', 3)
  expect(oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(420, 0)
  playSound('whack', 99)
  expect(oscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(700, 0)
})

test.each([
  ['escape', 2],
  ['pass', 3],
  ['fail', 3],
  ['stamp', 1],
  ['victory', 4],
] as const)('playSound("%s") 调度 %i 个振荡器', async (name, count) => {
  const { oscillators } = stubAudioContext()
  const { playSound } = await loadUseSound()
  playSound(name)
  expect(oscillators).toHaveLength(count)
  expect(oscillators.every((osc) => osc.start.mock.calls.length === 1)).toBe(true)
})

test('suspended 上下文在取用时自动 resume', async () => {
  const { contexts } = stubAudioContext({ state: 'suspended' })
  const { playSound } = await loadUseSound()
  playSound('stamp')
  const ctx = contexts[0] as { resume: Mock }
  expect(ctx.resume).toHaveBeenCalled()
})

test('上下文为单例：多次播放/解锁复用同一 AudioContext', async () => {
  const { contexts, oscillators } = stubAudioContext()
  const { playSound, unlockAudio } = await loadUseSound()
  unlockAudio()
  playSound('whack')
  playSound('stamp')
  unlockAudio()
  expect(contexts).toHaveLength(1)
  expect(oscillators).toHaveLength(2)
})

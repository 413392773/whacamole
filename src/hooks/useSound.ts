export type SoundName = 'whack' | 'escape' | 'pass' | 'fail' | 'stamp' | 'victory'

let audioCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null
  try {
    if (audioCtx === null) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function tone(
  ctx: AudioContext,
  freq: number,
  startIn: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.15,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + startIn
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

export function playSound(name: SoundName, combo = 0): void {
  const ctx = getContext()
  if (ctx === null) return
  switch (name) {
    case 'whack':
      tone(ctx, 300 + Math.min(combo, 10) * 40, 0, 0.12, 'square', 0.1)
      break
    case 'escape':
      tone(ctx, 220, 0, 0.15, 'sawtooth', 0.06)
      tone(ctx, 180, 0.08, 0.15, 'sawtooth', 0.06)
      break
    case 'pass':
      ;[523, 659, 784].forEach((f, i) => tone(ctx, f, i * 0.12, 0.25, 'triangle'))
      break
    case 'fail':
      ;[330, 262, 196].forEach((f, i) => tone(ctx, f, i * 0.15, 0.3, 'sine'))
      break
    case 'stamp':
      tone(ctx, 120, 0, 0.2, 'square', 0.2)
      break
    case 'victory':
      ;[523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, i * 0.15, 0.4, 'triangle'))
      break
  }
}

// 由 App 在首次 pointerdown 时调用一次（Task 9），满足移动端 AudioContext 手势解锁限制
export function unlockAudio(): void {
  getContext()
}

export function buzz(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(pattern)
  } catch {
    // 部分浏览器在非法状态下抛错，静默降级
  }
}

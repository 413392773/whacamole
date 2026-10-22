export interface Title {
  emoji: string
  name: string
  quote: string
}

export const TITLES: readonly Title[] = [
  { emoji: '🐣', name: '初入江湖', quote: '江湖路远，地鼠只是第一关！' },
  { emoji: '🏹', name: '小有名气', quote: '牛刀小试，侠名初显！' },
  { emoji: '⚡', name: '身手敏捷', quote: '加速来袭，难敌你身形如电！' },
  { emoji: '🎯', name: '弹无虚发', quote: '狂乱时刻的传说，锤出必中！' },
  { emoji: '👑', name: '一代宗师', quote: '幻影只差半步，宗师之名已立！' },
  { emoji: '🌟', name: '武林鼠神', quote: '五关尽破，天下无双！' },
]

export function getTitle(clearedLevels: number): Title {
  const index = Math.min(TITLES.length - 1, Math.max(0, clearedLevels))
  return TITLES[index]
}

export type Grade = 'S' | 'A' | 'B' | 'C'

export interface Rank {
  grade: Grade
  name: string
}

export function getRank(avgAccuracy: number): Rank {
  if (avgAccuracy >= 0.9) return { grade: 'S', name: '鼠神降临' }
  if (avgAccuracy >= 0.8) return { grade: 'A', name: '猎鼠大师' }
  if (avgAccuracy >= 0.7) return { grade: 'B', name: '眼疾手快' }
  return { grade: 'C', name: '险胜通关' }
}

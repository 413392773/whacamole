import type { LevelConfig, Mole, MoleProfile } from './types'

export const RISE_DURATION_MS = 150
export const RESOLVE_DELAY_MS = 300
const MAX_SPAWN_STEPS_PER_TICK = 50

export interface SpawnSnapshot {
  moles: Mole[]
  nextSpawnAt: number
  moleIdSeq: number
  spawned: number
  misses: number
}

export function emptySnapshot(now: number): SpawnSnapshot {
  return { moles: [], nextSpawnAt: now, moleIdSeq: 1, spawned: 0, misses: 0 }
}

function advanceMole(mole: Mole, now: number, stayMs: number): Mole {
  if (mole.resolvedAt !== undefined) return mole
  const elapsed = now - mole.spawnedAt
  if (elapsed >= stayMs) return { ...mole, state: 'escaped', resolvedAt: now }
  if (mole.state === 'rising' && elapsed >= RISE_DURATION_MS) return { ...mole, state: 'up' }
  return mole
}

function pickIndex(length: number, random: () => number): number {
  return Math.min(Math.floor(random() * length), length - 1)
}

function pickFreeHole(moles: readonly Mole[], holeCount: number, random: () => number): number | null {
  const occupied = new Set(moles.map((mole) => mole.holeIndex))
  const free: number[] = []
  for (let index = 0; index < holeCount; index++) {
    if (!occupied.has(index)) free.push(index)
  }
  if (free.length === 0) return null
  return free[pickIndex(free.length, random)]
}

export function tickSpawns(
  snapshot: SpawnSnapshot,
  now: number,
  level: LevelConfig,
  maxSimultaneous: number,
  holeCount: number,
  profiles: readonly MoleProfile[],
  random: () => number,
): SpawnSnapshot {
  let newEscapes = 0
  const advanced = snapshot.moles.map((mole) => {
    const next = advanceMole(mole, now, level.stayMs)
    if (next.state === 'escaped' && mole.state !== 'escaped') newEscapes += 1
    return next
  })
  const current: Mole[] = advanced.filter(
    (mole) => mole.resolvedAt === undefined || now - mole.resolvedAt < RESOLVE_DELAY_MS,
  )

  let { nextSpawnAt, moleIdSeq } = snapshot
  let spawned = snapshot.spawned
  let moles = current
  let steps = 0
  while (nextSpawnAt <= now && steps < MAX_SPAWN_STEPS_PER_TICK) {
    steps += 1
    const activeCount = moles.filter(
      (mole) => mole.state === 'rising' || mole.state === 'up',
    ).length
    if (activeCount < maxSimultaneous && profiles.length > 0) {
      const holeIndex = pickFreeHole(moles, holeCount, random)
      if (holeIndex !== null) {
        const profile = profiles[pickIndex(profiles.length, random)]
        moles = [
          ...moles,
          { id: moleIdSeq, holeIndex, profileId: profile.id, state: 'rising', spawnedAt: now },
        ]
        moleIdSeq += 1
        spawned += 1
      }
    }
    nextSpawnAt += level.spawnIntervalMs
  }
  // 防洪水护栏：因触顶退出且仍积压时丢弃积压，避免后续 tick 持续补冒
  if (steps >= MAX_SPAWN_STEPS_PER_TICK && nextSpawnAt <= now) {
    nextSpawnAt = now + level.spawnIntervalMs
  }

  return {
    moles,
    nextSpawnAt,
    moleIdSeq,
    spawned,
    misses: snapshot.misses + newEscapes,
  }
}

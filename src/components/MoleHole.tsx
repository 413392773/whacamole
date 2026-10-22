import type { Dispatch } from 'react'
import type { Action, Mole, MoleProfile } from '../core/types'

interface Props {
  holeIndex: number
  mole: Mole | undefined
  profiles: readonly MoleProfile[]
  dispatch: Dispatch<Action>
  now: number
}

function isActive(mole: Mole | undefined): boolean {
  return mole !== undefined && (mole.state === 'rising' || mole.state === 'up')
}

export function MoleHole({ holeIndex, mole, profiles, dispatch, now }: Props) {
  const profile = mole === undefined ? undefined : profiles.find((p) => p.id === mole.profileId)

  const handlePointerDown = () => {
    if (isActive(mole)) {
      dispatch({ type: 'WHACK', moleId: mole!.id, now })
    } else {
      dispatch({ type: 'WHIFF' })
    }
  }

  const showFlashRed = mole?.state === 'escaped'

  return (
    <div
      className={`hole${showFlashRed ? ' flash-red' : ''}`}
      data-testid={`hole-${holeIndex}`}
      onPointerDown={handlePointerDown}
    >
      <div className="dirt" />
      {mole !== undefined && (
        <div className="mole-slot">
          <div className={`mole ${mole.state}`}>
            {mole.state === 'hit' && <span className="stars">⭐💫</span>}
            {profile?.avatarDataUrl !== undefined ? (
              <img className="face" src={profile.avatarDataUrl} alt={profile.name || '地鼠'} />
            ) : (
              <span className="face">{profile?.emoji ?? '🐹'}</span>
            )}
            {profile !== undefined && profile.name !== '' && (
              <span className="nameplate">{profile.name}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

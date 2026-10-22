import type { ChangeEvent } from 'react'
import type { MoleProfile } from '../core/types'
import { MAX_NAME_LENGTH, MAX_PROFILES } from '../config/levels'
import { compressImage } from '../storage/profileStorage'
import { uid } from '../core/uid'

interface Props {
  profiles: readonly MoleProfile[]
  onChange: (profiles: MoleProfile[]) => void
  onNotify: (message: string) => void
}

export function ProfileEditor({ profiles, onChange, onNotify }: Props) {
  const addProfile = () => {
    if (profiles.length >= MAX_PROFILES) return
    onChange([...profiles, { id: uid('profile'), name: '' }])
  }

  const removeProfile = (id: string) => {
    onChange(profiles.filter((profile) => profile.id !== id))
  }

  const renameProfile = (id: string, name: string) => {
    onChange(
      profiles.map((profile) =>
        profile.id === id ? { ...profile, name: name.slice(0, MAX_NAME_LENGTH) } : profile,
      ),
    )
  }

  const uploadAvatar = async (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file === undefined) return
    try {
      const avatarDataUrl = await compressImage(file)
      onChange(
        profiles.map((profile) =>
          profile.id === id ? { ...profile, avatarDataUrl } : profile,
        ),
      )
    } catch (error) {
      onNotify(error instanceof Error ? error.message : '头像上传失败')
    }
  }

  return (
    <div className="profile-grid">
      {profiles.map((profile) => (
        <div className="profile-card" key={profile.id}>
          <button className="remove" aria-label="删除档案" onClick={() => removeProfile(profile.id)}>✕</button>
          <label className="avatar">
            {profile.avatarDataUrl !== undefined ? (
              <img src={profile.avatarDataUrl} alt={profile.name || '头像'} />
            ) : (
              <span>📷</span>
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => void uploadAvatar(profile.id, event)}
            />
          </label>
          <input
            type="text"
            value={profile.name}
            placeholder={`名字(≤${MAX_NAME_LENGTH}字)`}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => renameProfile(profile.id, event.target.value)}
          />
        </div>
      ))}
      {profiles.length < MAX_PROFILES && (
        <button className="profile-add" aria-label="添加档案" onClick={addProfile}>＋</button>
      )}
    </div>
  )
}

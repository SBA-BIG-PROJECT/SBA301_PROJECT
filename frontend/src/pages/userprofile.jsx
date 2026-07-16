import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService, authService } from '../services'
import { useToast, ToastContainer } from '../components/Toast.jsx'

// ─── Helper ─────────────────────────────────────────────────────────────────
const AVATAR_PLACEHOLDER = null

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value }) => (
  <div className="up-stat-card">
    <span className="up-stat-icon">{icon}</span>
    <span className="up-stat-value">{value ?? '—'}</span>
    <span className="up-stat-label">{label}</span>
  </div>
)

const InputField = ({ label, id, type = 'text', value, onChange, placeholder, error, hint }) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="up-field">
      <label htmlFor={id} className="up-field__label">{label}</label>
      <div className={isPassword ? 'relative' : ''}>
        <input
          id={id}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`up-field__input ${error ? 'up-field__input--error' : ''} ${isPassword ? 'pr-10' : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-light-200 hover:text-white transition-colors cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="up-field__error">{error}</p>}
      {hint && !error && <p className="up-field__hint">{hint}</p>}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

const UserProfile = ({ onClose }) => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const { toasts, showToast, closeToast } = useToast()

  // Data states
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Tab
  const [activeTab, setActiveTab] = useState('profile') // profile | security

  // Edit profile form
  const [editMode, setEditMode] = useState(false)
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [profileError, setProfileError] = useState({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  // Avatar uploading
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: '/profile' } })
      return
    }

    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [profileData, statsData] = await Promise.all([
          userService.getCurrentUserProfile(),
          userService.getUserStats().catch(() => null)
        ])
        if (!active) return
        setProfile(profileData)
        setStats(statsData)
        setFullName(profileData.fullName || '')
        setAge(profileData.age?.toString() || '')
      } catch (err) {
        if (active) setError('Could not load information. Please try again.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [navigate])

  // ── Avatar ─────────────────────────────────────────────────────────────────
  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const updated = await userService.uploadAvatar(file)
      setProfile(updated)
      showToast('Avatar updated successfully!', 'success')
    } catch (err) {
      showToast('Avatar upload failed. Please try again.', 'error')
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteAvatar = async () => {
    setAvatarUploading(true)
    try {
      const updated = await userService.deleteAvatar()
      setProfile(updated)
      showToast('Avatar deleted successfully.', 'success')
    } catch {
      showToast('Avatar deletion failed.', 'error')
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── Edit Profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const errors = {}
    if (fullName.trim().length < 2) errors.fullName = 'Name minimum 2 characters'
    if (fullName.trim().length > 100) errors.fullName = 'Name maximum 100 characters'
    if (age && (Number(age) < 13 || Number(age) > 150)) errors.age = 'Age must be between 13 and 150'
    if (Object.keys(errors).length) { setProfileError(errors); return }

    setProfileSaving(true)
    setProfileError({})
    setProfileMsg('')
    try {
      const updated = await userService.updateProfile({
        fullName: fullName.trim(),
        age: age ? Number(age) : undefined
      })
      setProfile(updated)
      setEditMode(false)
      setProfileMsg('Updated successfully!')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed.'
      setProfileError({ api: msg })
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Change Password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!currentPassword) errors.current = 'Enter current password'
    if (newPassword.length < 8) errors.new = 'Password minimum 8 characters'
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword))
      errors.new = 'Must contain uppercase, lowercase and numbers'
    if (newPassword !== confirmPassword) errors.confirm = 'Passwords do not match'
    if (Object.keys(errors).length) { setPwError(errors); return }

    setPwSaving(true)
    setPwError({})
    setPwMsg('')
    try {
      await userService.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPwMsg('Password changed successfully!')
      setTimeout(() => setPwMsg(''), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Password change failed.'
      setPwError({ api: msg })
    } finally {
      setPwSaving(false)
    }
  }

  // ── Delete Account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError('Enter password to confirm'); return }
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await userService.deleteAccount({ password: deletePassword })
      authService.logout()
      navigate('/')
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Account deletion failed.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) await import('../services').then(m => m.authService.logout(refreshToken))
    } catch { /* ignore */ }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    navigate('/')
    onClose?.()
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="up-loading">
        <div className="up-spinner" />
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="up-error">
        <p>{error}</p>
        <button className="up-btn up-btn--primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }

  const avatarLetter = profile?.fullName?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="up-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="up-modal" role="dialog" aria-label="User Profile">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="up-header">
          <h2 className="up-title">User Profile</h2>
          {onClose && (
            <button className="up-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Avatar + identity ──────────────────────────── */}
        <div className="up-identity">
          <div className="up-avatar-wrap">
            <div className="up-avatar" onClick={handleAvatarClick} title="Change avatar">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="up-avatar__img" />
              ) : (
                <span className="up-avatar__letter">{avatarLetter}</span>
              )}
              {avatarUploading && <div className="up-avatar__overlay"><div className="up-spinner up-spinner--sm" /></div>}
              <div className="up-avatar__edit-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="up-avatar__file"
              onChange={handleAvatarChange}
            />
            {profile?.avatarUrl && (
              <button className="up-avatar__remove" onClick={handleDeleteAvatar} title="Remove avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/>
                </svg>
              </button>
            )}
          </div>

          <div className="up-identity__info">
            <h3 className="up-identity__name">{profile?.fullName || 'User'}</h3>
            <p className="up-identity__email">{profile?.email}</p>
            <div className="up-identity__badges">
              {profile?.isPremium ? (
                <span className="up-badge up-badge--premium">
                  ⭐ Premium
                </span>
              ) : (
                <span className="up-badge up-badge--free">Free</span>
              )}
              <span className="up-badge up-badge--role">{profile?.role || 'USER'}</span>
            </div>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        {stats && (
          <div className="up-stats">
            <StatCard icon="🎬" label="Watched" value={stats.totalViewedMovies} />
            <StatCard icon="📝" label="Reviews" value={stats.totalReviews} />
            <StatCard icon="🔖" label="Watchlist" value={stats.totalWatchlistItems} />
            <StatCard icon="⭐" label="Avg Rating" value={stats.averageRating ? (Number(stats.averageRating) / 2).toFixed(1) : '—'} />
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────── */}
        <div className="up-tabs">
          <button
            className={`up-tab ${activeTab === 'profile' ? 'up-tab--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Information
          </button>
          <button
            className={`up-tab ${activeTab === 'security' ? 'up-tab--active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        {/* ── Tab: Profile ───────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="up-tab-content">
            {profileMsg && <div className="up-alert up-alert--success">{profileMsg}</div>}
            {profileError.api && <div className="up-alert up-alert--error">{profileError.api}</div>}

            {editMode ? (
              <form onSubmit={handleSaveProfile} className="up-form">
                <InputField
                  label="Full Name"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  error={profileError.fullName}
                />
                <InputField
                  label="Age"
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter age (13-150)"
                  error={profileError.age}
                />
                <div className="up-form__actions">
                  <button type="submit" className="up-btn up-btn--primary" disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button type="button" className="up-btn up-btn--ghost" onClick={() => { setEditMode(false); setProfileError({}) }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="up-info-list">
                <div className="up-info-row">
                  <span className="up-info-label">Full Name</span>
                  <span className="up-info-value">{profile?.fullName || '—'}</span>
                </div>
                <div className="up-info-row">
                  <span className="up-info-label">Email</span>
                  <span className="up-info-value">{profile?.email}</span>
                </div>
                <div className="up-info-row">
                  <span className="up-info-label">Age</span>
                  <span className="up-info-value">{profile?.age || '—'}</span>
                </div>
                <div className="up-info-row">
                  <span className="up-info-label">Joined</span>
                  <span className="up-info-value">{fmtDate(profile?.createdAt)}</span>
                </div>
                {profile?.isPremium && (
                  <div className="up-info-row">
                    <span className="up-info-label">Premium expires</span>
                    <span className="up-info-value">{fmtDate(profile?.premiumExpiresAt)}</span>
                  </div>
                )}
                <button className="up-btn up-btn--primary up-btn--full mt-4" onClick={() => setEditMode(true)}>
                  ✏️ Edit information
                </button>
              </div>
            )}

            {/* Quick links */}
            <div className="up-quick-links">
              <a className="up-quick-link" href="/watchlist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                Watchlist
              </a>
              <a className="up-quick-link" href="/history">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Watch History
              </a>
            </div>

            <div className="up-danger-section">
              <button className="up-btn up-btn--logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Security ──────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="up-tab-content">
            <h3 className="up-section-title">Change Password</h3>
            {pwMsg && <div className="up-alert up-alert--success">{pwMsg}</div>}
            {pwError.api && <div className="up-alert up-alert--error">{pwError.api}</div>}

            <form onSubmit={handleChangePassword} className="up-form">
              <InputField
                label="Current Password"
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                error={pwError.current}
              />
              <InputField
                label="New Password"
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, mixed case/numbers"
                error={pwError.new}
                hint="Password must contain at least 1 uppercase, 1 lowercase and 1 number."
              />
              <InputField
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                error={pwError.confirm}
              />
              <div className="up-form__actions">
                <button type="submit" className="up-btn up-btn--primary" disabled={pwSaving}>
                  {pwSaving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>

            {/* Delete account */}
            <div className="up-danger-section">
              <h3 className="up-section-title up-section-title--danger">Danger Zone</h3>
              <p className="up-danger-desc">Deleting your account is irreversible. All your data will be permanently deleted.</p>
              <button
                className="up-btn up-btn--danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/>
                </svg>
                Delete account
              </button>
            </div>
          </div>
        )}

        {/* ── Delete Account Modal ────────────────────────── */}
        {showDeleteModal && (
          <div className="up-confirm-overlay" onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
            <div className="up-confirm-modal">
              <h3>⚠️ Confirm account deletion</h3>
              <p>This action cannot be undone. Enter password to confirm:</p>
              <div className="relative">
                <input
                  type={showDeletePassword ? 'text' : 'password'}
                  className="up-field__input pr-10"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-light-200 hover:text-white transition-colors cursor-pointer"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                >
                  {showDeletePassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {deleteError && <p className="up-field__error">{deleteError}</p>}
              <div className="up-form__actions">
                <button className="up-btn up-btn--danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting...' : 'Confirm deletion'}
                </button>
                <button className="up-btn up-btn--ghost" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); setShowDeletePassword(false); }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  )
}

export default UserProfile

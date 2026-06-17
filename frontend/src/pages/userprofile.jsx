import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService, authService } from '../services'

// ─── Helper ─────────────────────────────────────────────────────────────────
const AVATAR_PLACEHOLDER = null

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
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

const InputField = ({ label, id, type = 'text', value, onChange, placeholder, error, hint }) => (
  <div className="up-field">
    <label htmlFor={id} className="up-field__label">{label}</label>
    <input
      id={id}
      type={type}
      className={`up-field__input ${error ? 'up-field__input--error' : ''}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
    />
    {error && <p className="up-field__error">{error}</p>}
    {hint && !error && <p className="up-field__hint">{hint}</p>}
  </div>
)

// ─── Main Component ──────────────────────────────────────────────────────────

const UserProfile = ({ onClose }) => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

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
        if (active) setError('Không tải được thông tin. Vui lòng thử lại.')
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
    } catch (err) {
      alert('Upload avatar thất bại. Vui lòng thử lại.')
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
    } catch {
      alert('Xoá avatar thất bại.')
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── Edit Profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const errors = {}
    if (fullName.trim().length < 2) errors.fullName = 'Tên tối thiểu 2 ký tự'
    if (fullName.trim().length > 100) errors.fullName = 'Tên tối đa 100 ký tự'
    if (age && (Number(age) < 13 || Number(age) > 150)) errors.age = 'Tuổi phải từ 13 đến 150'
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
      setProfileMsg('Cập nhật thành công!')
      setTimeout(() => setProfileMsg(''), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Cập nhật thất bại.'
      setProfileError({ api: msg })
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Change Password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!currentPassword) errors.current = 'Nhập mật khẩu hiện tại'
    if (newPassword.length < 8) errors.new = 'Mật khẩu tối thiểu 8 ký tự'
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword))
      errors.new = 'Phải có chữ hoa, chữ thường và số'
    if (newPassword !== confirmPassword) errors.confirm = 'Mật khẩu không khớp'
    if (Object.keys(errors).length) { setPwError(errors); return }

    setPwSaving(true)
    setPwError({})
    setPwMsg('')
    try {
      await userService.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPwMsg('Đổi mật khẩu thành công!')
      setTimeout(() => setPwMsg(''), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại.'
      setPwError({ api: msg })
    } finally {
      setPwSaving(false)
    }
  }

  // ── Delete Account ─────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError('Nhập mật khẩu để xác nhận'); return }
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await userService.deleteAccount({ password: deletePassword })
      authService.logout()
      navigate('/')
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Xoá tài khoản thất bại.')
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
        <p>Đang tải hồ sơ...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="up-error">
        <p>{error}</p>
        <button className="up-btn up-btn--primary" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    )
  }

  const avatarLetter = profile?.fullName?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="up-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="up-modal" role="dialog" aria-label="Hồ sơ cá nhân">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="up-header">
          <h2 className="up-title">Hồ sơ cá nhân</h2>
          {onClose && (
            <button className="up-close" onClick={onClose} aria-label="Đóng">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Avatar + identity ──────────────────────────── */}
        <div className="up-identity">
          <div className="up-avatar-wrap">
            <div className="up-avatar" onClick={handleAvatarClick} title="Đổi ảnh đại diện">
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
              <button className="up-avatar__remove" onClick={handleDeleteAvatar} title="Xoá ảnh">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/>
                </svg>
              </button>
            )}
          </div>

          <div className="up-identity__info">
            <h3 className="up-identity__name">{profile?.fullName || 'Người dùng'}</h3>
            <p className="up-identity__email">{profile?.email}</p>
            <div className="up-identity__badges">
              {profile?.isPremium ? (
                <span className="up-badge up-badge--premium">
                  ⭐ Premium
                </span>
              ) : (
                <span className="up-badge up-badge--free">Miễn phí</span>
              )}
              <span className="up-badge up-badge--role">{profile?.role || 'USER'}</span>
            </div>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        {stats && (
          <div className="up-stats">
            <StatCard icon="🎬" label="Đã xem" value={stats.totalViewedMovies} />
            <StatCard icon="📝" label="Đánh giá" value={stats.totalReviews} />
            <StatCard icon="🔖" label="Watchlist" value={stats.totalWatchlistItems} />
            <StatCard icon="⭐" label="TB đánh giá" value={stats.averageRating ? Number(stats.averageRating).toFixed(1) : '—'} />
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────── */}
        <div className="up-tabs">
          <button
            className={`up-tab ${activeTab === 'profile' ? 'up-tab--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Thông tin
          </button>
          <button
            className={`up-tab ${activeTab === 'security' ? 'up-tab--active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Bảo mật
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
                  label="Họ và tên"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập tên đầy đủ"
                  error={profileError.fullName}
                />
                <InputField
                  label="Tuổi"
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Nhập tuổi (13-150)"
                  error={profileError.age}
                />
                <div className="up-form__actions">
                  <button type="submit" className="up-btn up-btn--primary" disabled={profileSaving}>
                    {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button type="button" className="up-btn up-btn--ghost" onClick={() => { setEditMode(false); setProfileError({}) }}>
                    Huỷ
                  </button>
                </div>
              </form>
            ) : (
              <div className="up-info-list">
                <div className="up-info-row">
                  <span className="up-info-label">Họ và tên</span>
                  <span className="up-info-value">{profile?.fullName || '—'}</span>
                </div>
                <div className="up-info-row">
                  <span className="up-info-label">Email</span>
                  <span className="up-info-value">{profile?.email}</span>
                </div>
                <div className="up-info-row">
                  <span className="up-info-label">Tuổi</span>
                  <span className="up-info-value">{profile?.age || '—'}</span>
                </div>
                <div className="up-info-row">
                  <span className="up-info-label">Tham gia</span>
                  <span className="up-info-value">{fmtDate(profile?.createdAt)}</span>
                </div>
                {profile?.isPremium && (
                  <div className="up-info-row">
                    <span className="up-info-label">Premium hết hạn</span>
                    <span className="up-info-value">{fmtDate(profile?.premiumExpiresAt)}</span>
                  </div>
                )}
                <button className="up-btn up-btn--primary up-btn--full mt-4" onClick={() => setEditMode(true)}>
                  ✏️ Chỉnh sửa thông tin
                </button>
              </div>
            )}

            {/* Quick links */}
            <div className="up-quick-links">
              <a className="up-quick-link" href="/watchlist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                Danh sách yêu thích
              </a>
              <a className="up-quick-link" href="/history">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Lịch sử xem
              </a>
            </div>

            <div className="up-danger-section">
              <button className="up-btn up-btn--logout" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Security ──────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="up-tab-content">
            <h3 className="up-section-title">Đổi mật khẩu</h3>
            {pwMsg && <div className="up-alert up-alert--success">{pwMsg}</div>}
            {pwError.api && <div className="up-alert up-alert--error">{pwError.api}</div>}

            <form onSubmit={handleChangePassword} className="up-form">
              <InputField
                label="Mật khẩu hiện tại"
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                error={pwError.current}
              />
              <InputField
                label="Mật khẩu mới"
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự, có hoa/thường/số"
                error={pwError.new}
                hint="Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số."
              />
              <InputField
                label="Xác nhận mật khẩu mới"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                error={pwError.confirm}
              />
              <div className="up-form__actions">
                <button type="submit" className="up-btn up-btn--primary" disabled={pwSaving}>
                  {pwSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>

            {/* Delete account */}
            <div className="up-danger-section">
              <h3 className="up-section-title up-section-title--danger">Vùng nguy hiểm</h3>
              <p className="up-danger-desc">Xoá tài khoản sẽ không thể khôi phục. Tất cả dữ liệu của bạn sẽ bị xoá vĩnh viễn.</p>
              <button
                className="up-btn up-btn--danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/>
                </svg>
                Xoá tài khoản
              </button>
            </div>
          </div>
        )}

        {/* ── Delete Account Modal ────────────────────────── */}
        {showDeleteModal && (
          <div className="up-confirm-overlay" onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
            <div className="up-confirm-modal">
              <h3>⚠️ Xác nhận xoá tài khoản</h3>
              <p>Hành động này không thể hoàn tác. Nhập mật khẩu để xác nhận:</p>
              <input
                type="password"
                className="up-field__input"
                placeholder="Mật khẩu của bạn"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              {deleteError && <p className="up-field__error">{deleteError}</p>}
              <div className="up-form__actions">
                <button className="up-btn up-btn--danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
                  {deleteLoading ? 'Đang xoá...' : 'Xác nhận xoá'}
                </button>
                <button className="up-btn up-btn--ghost" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError('') }}>
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile

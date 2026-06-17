import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/'
  const message = location.state?.message || ''

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Backend LoginRequest chỉ yêu cầu email và password
      const response = await authService.login({ email, password })
      
      const user = response.user;
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN' || 
                      user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN') ||
                      user?.authorities?.some(a => a.authority === 'ROLE_ADMIN');

      // Đăng nhập thành công, chuyển hướng về trang chủ hoặc dashboard
      if (isAdmin) {
        navigate('/admin/dashboard')
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <h2>Welcome back</h2>
        {message && <div className="p-3 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">{message}</div>}
        {error && <p className="status" style={{ color: 'red' }}>{error}</p>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <label className="auth__label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="auth__input"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <label className="auth__label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="auth__input"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <div className="auth__actions">
            <button className="btn btn--primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <p className="auth__footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  )
}

export default Login

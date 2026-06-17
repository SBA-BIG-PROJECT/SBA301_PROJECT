import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Backend LoginRequest chỉ yêu cầu email và password
      await authService.login({ email, password })
      
      // Đăng nhập thành công, chuyển hướng về trang chủ
      navigate('/')
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

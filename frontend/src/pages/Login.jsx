import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/'
  const message = location.state?.message || ''

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Backend LoginRequest only requires email and password
      const response = await authService.login({ email, password })
      
      const user = response.user;
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN' || 
                      user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN') ||
                      user?.authorities?.some(a => a.authority === 'ROLE_ADMIN');

      // Login success, redirect to home or dashboard
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
          <div className="relative">
            <input
              id="login-password"
              className="auth__input pr-10"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
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
          </div>

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

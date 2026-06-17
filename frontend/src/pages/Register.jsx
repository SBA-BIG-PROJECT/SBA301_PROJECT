import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services'

const Register = () => {
  const [fullName, setFullName] = useState('')
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
      // Gửi đúng các trường mà backend RegisterRequest yêu cầu
      await authService.register({
        fullName,
        email,
        password
      })
      
      // Đăng ký thành công thì chuyển về trang login
      navigate('/login')
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <h2>Create your account</h2>
        {error && <p className="status" style={{ color: 'red' }}>{error}</p>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <label className="auth__label" htmlFor="register-name">
            Full name
          </label>
          <input
            id="register-name"
            className="auth__input"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isLoading}
          />

          <label className="auth__label" htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            className="auth__input"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <label className="auth__label" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            className="auth__input"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />

          <div className="auth__actions">
            <button className="btn btn--primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        <p className="auth__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  )
}

export default Register

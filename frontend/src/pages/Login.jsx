import { Link } from 'react-router-dom'

const Login = () => {
  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <h2>Welcome back</h2>
        <p className="auth__hint">UI only for now. Auth will be wired later.</p>

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
            required
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
            required
          />

          <div className="auth__actions">
            <button className="btn btn--primary" type="submit">
              Sign in
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

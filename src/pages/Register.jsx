import { Link } from 'react-router-dom'

const Register = () => {
  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <section className="auth">
      <div className="auth__card">
        <h2>Create your account</h2>
        <p className="auth__hint">UI only for now. Auth will be wired later.</p>

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
            required
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
            required
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
            required
          />

          <div className="auth__actions">
            <button className="btn btn--primary" type="submit">
              Create account
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

import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import PageShell from '../../features/public/components/PageShell'
import { useAuth } from '../../context/AuthContext'

function LoginPage() {
  const { login, user, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const loggedInUser = await login(form)
      const roleHome = loggedInUser.role === 'admin' ? '/admin' : '/student'
      const fromPath = typeof location.state?.from?.pathname === 'string' ? location.state.from.pathname : ''

      let target = roleHome
      if (fromPath.startsWith('/')) {
        if (loggedInUser.role === 'admin') {
          target = fromPath.startsWith('/admin') ? fromPath : roleHome
        } else {
          target = fromPath.startsWith('/student') || fromPath === '/apply-now' ? fromPath : roleHome
        }
      }

      navigate(target, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell buttonLabel="Create Account" buttonTo="/signup">
      <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 md:px-12">
        <section className="mx-auto max-w-2xl rounded-2xl border border-[#ece7e4] bg-white p-8 shadow-sm md:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Authentication</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#1c1b1b]">Welcome Back</h1>
          <p className="mt-2 text-secondary">Login to continue to your student or admin dashboard.</p>

          <div className="mt-6 rounded-xl border border-[#ece7e4] bg-[#f8f3e9] p-4 text-sm text-[#5f4f1a]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Demo Credentials</p>
            <p className="mt-1">
              Student: <strong>student@dormdoor.com / Student123!</strong>
            </p>
            <p>
              Admin: <strong>admin@dormdoor.com / Admin123!</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
            <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9d9a98] focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9d9a98] focus:ring-2 focus:ring-primary"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {error ? <p className="text-sm font-semibold text-[#d63c56]">{error}</p> : null}
          </form>

          <p className="mt-6 text-sm text-secondary">
            New here?{' '}
            <Link to="/signup" className="font-bold text-primary">
              Create an account
            </Link>
          </p>
        </section>
      </main>
    </PageShell>
  )
}

export default LoginPage

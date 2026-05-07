import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import PageShell from '../../features/public/components/PageShell'
import { useAuth } from '../../context/AuthContext'

const initialState = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  gender: 'Prefer not to say',
  studentId: '',
  phone: '',
  department: '',
  university: '',
  address: '',
}

function dashboardPathForRole(role) {
  if (role === 'superAdmin') return '/super-admin/dashboard'
  if (role === 'admin') return '/admin'
  return '/student'
}

function SignupPage() {
  const { signup, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(initialState)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated && user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />
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
      const createdUser = await signup(form)
      navigate(dashboardPathForRole(createdUser.role), { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell buttonLabel="Login" buttonTo="/login">
      <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 md:px-12">
        <section className="mx-auto max-w-3xl rounded-2xl border border-[#ece7e4] bg-white p-8 shadow-sm md:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Registration</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#1c1b1b]">Create Account</h1>
          <p className="mt-2 text-secondary">Register as student or dorm admin to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-5 md:grid-cols-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary md:col-span-2">
              Full name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9d9a98] focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Role
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] focus:ring-2 focus:ring-primary"
              >
                <option value="student">Student</option>
                <option value="admin">Dorm Admin</option>
              </select>
            </label>

            <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Gender
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] focus:ring-2 focus:ring-primary"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </label>

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

            <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary md:col-span-2">
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

            {form.role === 'student' ? (
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary md:col-span-2">
                Student ID
                <input
                  name="studentId"
                  value={form.studentId}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9d9a98] focus:ring-2 focus:ring-primary"
                />
              </label>
            ) : null}

            <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9d9a98] focus:ring-2 focus:ring-primary"
              />
            </label>

            {form.role === 'student' ? (
              <>
                <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                  Department
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9d9a98] focus:ring-2 focus:ring-primary"
                  />
                </label>

                <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary md:col-span-2">
                  University
                  <input
                    name="university"
                    value={form.university}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9d9a98] focus:ring-2 focus:ring-primary"
                  />
                </label>
              </>
            ) : (
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary md:col-span-2">
                Address
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border-none bg-[#f1ecea] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9d9a98] focus:ring-2 focus:ring-primary"
                />
              </label>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            {error ? <p className="text-sm font-semibold text-[#d63c56] md:col-span-2">{error}</p> : null}
          </form>

          <p className="mt-6 text-sm text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary">
              Login
            </Link>
          </p>
        </section>
      </main>
    </PageShell>
  )
}

export default SignupPage

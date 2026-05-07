import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import AdminLayout from '../../components/dashboard/AdminLayout'

function AdminSettingsPage() {
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    address: '',
    settings: {
      emailNotifications: true,
      pushNotifications: true,
    },
  })
  const [password, setPassword] = useState({ oldPassword: '', newPassword: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    api
      .get('/profile')
      .then(({ data }) => {
        const user = data.user
        setProfile({
          name: user.name || '',
          phone: user.phone || '',
          address: user.address || '',
          settings: {
            emailNotifications: user.settings?.emailNotifications ?? true,
            pushNotifications: user.settings?.pushNotifications ?? true,
          },
        })
      })
      .catch(() => setMessage('Failed to load settings'))
  }, [])

  const handleProfileChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name.startsWith('settings.')) {
      const key = name.replace('settings.', '')
      setProfile((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [key]: type === 'checkbox' ? checked : value,
        },
      }))
      return
    }

    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPassword((prev) => ({ ...prev, [name]: value }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    try {
      await api.patch('/profile', profile)
      setMessage('Settings saved')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save settings')
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    try {
      await api.patch('/profile/password', password)
      setMessage('Password changed')
      setPassword({ oldPassword: '', newPassword: '' })
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to change password')
    }
  }

  return (
    <AdminLayout>
      <h1>Settings</h1>
      {message ? <p className="form-message">{message}</p> : null}

      <section className="card">
        <h2>Profile & Preferences</h2>
        <form className="form" onSubmit={saveProfile}>
          <div className="form-grid">
            <label>
              Name
              <input name="name" value={profile.name} onChange={handleProfileChange} />
            </label>
            <label>
              Phone
              <input name="phone" value={profile.phone} onChange={handleProfileChange} />
            </label>
            <label>
              Address
              <input name="address" value={profile.address} onChange={handleProfileChange} />
            </label>
            <label className="checkbox-inline">
              <input type="checkbox" name="settings.emailNotifications" checked={profile.settings.emailNotifications} onChange={handleProfileChange} />
              Email notifications
            </label>
            <label className="checkbox-inline">
              <input type="checkbox" name="settings.pushNotifications" checked={profile.settings.pushNotifications} onChange={handleProfileChange} />
              Push notifications
            </label>
          </div>

          <button className="btn btn-primary" type="submit">Save Profile</button>
        </form>
      </section>

      <section className="card">
        <h2>Security</h2>
        <form className="form" onSubmit={changePassword}>
          <label>
            Current Password
            <input name="oldPassword" type="password" value={password.oldPassword} onChange={handlePasswordChange} required />
          </label>
          <label>
            New Password
            <input name="newPassword" type="password" value={password.newPassword} onChange={handlePasswordChange} required />
          </label>
          <button className="btn btn-outline" type="submit">Change Password</button>
        </form>
      </section>
    </AdminLayout>
  )
}

export default AdminSettingsPage

import { useEffect, useState } from 'react'
import AdminLayout from '../components/layout/AdminLayout'
import { topbarAvatars } from '../data/dashboardData'
import Icon from '../components/Icon'
import { api } from '../../../api/client'

function Field({ label, value, onChange, accent = false, type = 'text', readOnly = false }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</label>
      <input
        className={`w-full rounded-lg border-none px-4 py-3 text-sm font-medium ${accent ? 'bg-[#ebe7e7] text-primary font-bold' : 'bg-[#f0edec]'}`}
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
      />
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange} className={`relative h-6 w-11 rounded-full p-1 ${checked ? 'bg-primary' : 'bg-[#d9dbe0]'}`}>
      <div className={`h-4 w-4 rounded-full bg-white transition ${checked ? 'ml-auto' : ''}`} />
    </button>
  )
}

function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [profile, setProfile] = useState({
    name: '',
    role: 'Admin',
    email: '',
    phone: '',
    profileImage: '',
    settings: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
  })

  const [preferences, setPreferences] = useState({
    darkMode: false,
    notificationFrequency: 'Instant',
    defaultLanguage: 'English (US)',
    systemEmail: 'system@atelier.edu',
    maintenanceMode: false,
    twoFactor: true,
  })

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setError('')

      try {
        const { data } = await api.get('/profile')
        const user = data.user
        setProfile({
          name: user.name || '',
          role: user.role === 'admin' ? 'Head Admin' : 'Student',
          email: user.email || '',
          phone: user.phone || '',
          profileImage: user.profileImage || '',
          settings: {
            emailNotifications: user.settings?.emailNotifications ?? true,
            pushNotifications: user.settings?.pushNotifications ?? true,
            smsNotifications: user.settings?.smsNotifications ?? false,
          },
        })
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const updateSetting = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }))
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    setMessage('')
    setError('')

    try {
      await api.patch('/profile', {
        name: profile.name,
        phone: profile.phone,
        profileImage: profile.profileImage,
        settings: profile.settings,
      })
      setMessage('Configuration saved successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to save configuration.')
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async () => {
    setSavingPassword(true)
    setMessage('')
    setError('')

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setError('Old password and new password are required.')
      setSavingPassword(false)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match.')
      setSavingPassword(false)
      return
    }

    try {
      await api.patch('/profile/password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })
      setMessage('Password updated successfully.')
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <AdminLayout
      activeKey="settings"
      topbarProps={{
        searchPlaceholder: 'Quick search...',
        profileName: 'Admin User',
        profileRole: 'Head Admin',
        avatar: topbarAvatars.admin,
      }}
      contentClassName="p-8"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-5xl font-extrabold tracking-tight">Settings</h2>
            <p className="mt-1 text-sm text-secondary">Configure your administrative environment and personal profile.</p>
            {loading ? <p className="mt-2 text-sm text-secondary">Loading settings...</p> : null}
            {message ? <p className="mt-2 text-sm font-semibold text-primary">{message}</p> : null}
            {error ? <p className="mt-2 text-sm font-semibold text-error">{error}</p> : null}
          </div>
          <div className="flex items-center gap-4 text-secondary">
            <button type="button" className="rounded-full p-2 hover:bg-slate-100"><Icon name="notifications" /></button>
            <button type="button" className="rounded-full p-2 hover:bg-slate-100"><Icon name="help_outline" /></button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <section className="md:col-span-8 rounded-xl border border-[#ece7e4] bg-white p-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="relative">
              <img alt="Admin profile" className="h-32 w-32 rounded-xl object-cover" src={profile.profileImage || topbarAvatars.admin} />
              <button type="button" className="absolute -bottom-2 -right-2 rounded-lg bg-primary p-2 text-white shadow-lg"><Icon name="edit" className="text-sm" /></button>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2 w-full">
              <Field label="Full Name" value={profile.name} onChange={(event) => updateProfileField('name', event.target.value)} />
              <Field label="Role" value={profile.role} accent readOnly />
              <Field label="Email" value={profile.email} type="email" readOnly />
              <Field label="Phone Number" value={profile.phone} type="tel" onChange={(event) => updateProfileField('phone', event.target.value)} />
            </div>
          </section>

          <section className="md:col-span-4 rounded-xl bg-[#f0edec] p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Icon name="tune" className="text-primary" /> Preferences</h3>
              <div className="flex items-center justify-between rounded-lg bg-white p-3">
                <span className="text-sm font-semibold">Dark Mode</span>
                <Toggle checked={preferences.darkMode} onChange={() => setPreferences((prev) => ({ ...prev, darkMode: !prev.darkMode }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Notification Frequency</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPreferences((prev) => ({ ...prev, notificationFrequency: 'Instant' }))} className={`rounded-lg py-2 text-xs font-bold ${preferences.notificationFrequency === 'Instant' ? 'bg-primary text-white' : 'bg-white text-secondary'}`}>Instant</button>
                  <button type="button" onClick={() => setPreferences((prev) => ({ ...prev, notificationFrequency: 'Daily Digest' }))} className={`rounded-lg py-2 text-xs font-bold ${preferences.notificationFrequency === 'Daily Digest' ? 'bg-primary text-white' : 'bg-white text-secondary'}`}>Daily Digest</button>
                </div>
              </div>
            </div>
          </section>

          <section className="md:col-span-6 rounded-xl border border-[#ece7e4] bg-white p-8 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><Icon name="settings" className="text-primary" /> System Configuration</h3>
            <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
              <div>
                <p className="text-sm font-bold text-red-700">Maintenance Mode</p>
                <p className="text-xs text-red-500">Disable public portal access for updates.</p>
              </div>
              <Toggle checked={preferences.maintenanceMode} onChange={() => setPreferences((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Default Language</label>
              <select value={preferences.defaultLanguage} onChange={(event) => setPreferences((prev) => ({ ...prev, defaultLanguage: event.target.value }))} className="mt-2 w-full rounded-lg border-none bg-[#f0edec] px-4 py-3">
                <option>English (US)</option>
                <option>Bengali</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">System Email Notifications</label>
              <input value={preferences.systemEmail} onChange={(event) => setPreferences((prev) => ({ ...prev, systemEmail: event.target.value }))} className="mt-2 w-full rounded-lg border-none bg-[#f0edec] px-4 py-3" />
            </div>
          </section>

          <section className="md:col-span-6 rounded-xl bg-[#f0edec] p-8 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><Icon name="shield" className="text-primary" /> Security</h3>
            <div className="space-y-3">
              <input
                value={passwordForm.oldPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
                className="w-full rounded-lg border-none bg-white px-4 py-3 text-sm"
                placeholder="Old Password"
                type="password"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  className="rounded-lg border-none bg-white px-4 py-3 text-sm"
                  placeholder="New Password"
                  type="password"
                />
                <input
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="rounded-lg border-none bg-white px-4 py-3 text-sm"
                  placeholder="Confirm New"
                  type="password"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#e3ddda] pt-4">
              <div>
                <p className="font-bold">Two-Factor Authentication</p>
                <p className="text-xs text-secondary">Enhance account security via SMS/Email.</p>
              </div>
              <Toggle checked={preferences.twoFactor} onChange={() => setPreferences((prev) => ({ ...prev, twoFactor: !prev.twoFactor }))} />
            </div>
            <div className="border-t border-[#e3ddda] pt-4 text-sm text-secondary">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest">Notification Channel</p>
              <div className="flex items-center justify-between py-1">
                <span>Email Notifications</span>
                <Toggle checked={profile.settings.emailNotifications} onChange={() => updateSetting('emailNotifications', !profile.settings.emailNotifications)} />
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Push Notifications</span>
                <Toggle checked={profile.settings.pushNotifications} onChange={() => updateSetting('pushNotifications', !profile.settings.pushNotifications)} />
              </div>
              <div className="flex items-center justify-between py-1">
                <span>SMS Notifications</span>
                <Toggle checked={profile.settings.smsNotifications} onChange={() => updateSetting('smsNotifications', !profile.settings.smsNotifications)} />
              </div>
            </div>
            <button type="button" onClick={changePassword} disabled={savingPassword} className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </section>
        </div>

        <div className="mt-10 flex justify-end gap-6">
          <button type="button" onClick={() => window.location.reload()} className="px-6 py-4 text-lg text-secondary">Discard Changes</button>
          <button type="button" onClick={saveProfile} disabled={savingProfile || loading} className="rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-70">
            {savingProfile ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default SettingsPage

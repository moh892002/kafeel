import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/api', () => ({
  api: {
    settings: vi.fn(),
    updateSettings: vi.fn(),
    changePassword: vi.fn(),
    loginSessions: vi.fn(),
    terminateSession: vi.fn(),
  },
}))

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    admin: { name: 'عبدالرحمن السالم' },
    logout: authMocks.logout,
    updateProfile: authMocks.updateProfile,
  }),
}))

import { api } from '@/app/api'
import Profile from './ProfilePage'

const SETTINGS = {
  'profile.name': 'عبدالرحمن السالم',
  'profile.email': 'admin@kafeel.sa',
  'security.twoFa': 'true',
}

const currentSession = {
  id: 1,
  device: 'Chrome على Linux',
  location: null,
  ip: '192.168.1.5',
  current: true,
  active: true,
  lastActive: new Date().toISOString(),
}

const oldSession = {
  id: 2,
  device: 'iPhone 15 Pro — Safari',
  location: 'الرياض، السعودية',
  ip: '192.168.1.9',
  current: false,
  active: true,
  lastActive: new Date(Date.now() - 3 * 3600_000).toISOString(),
}

const terminatedSession = {
  id: 3,
  device: 'Chrome على Windows',
  location: 'الدمام، السعودية',
  ip: '192.168.1.12',
  current: false,
  active: false,
  lastActive: new Date(Date.now() - 86400_000).toISOString(),
}

describe('Profile page — security tab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.updateProfile.mockResolvedValue({
      token: 'jwt-new',
      email: 'admin@kafeel.sa',
      name: 'عبدالرحمن السالم',
    })
    api.settings.mockResolvedValue(SETTINGS)
    api.loginSessions.mockResolvedValue([currentSession, oldSession])
    api.updateSettings.mockResolvedValue({})
    api.terminateSession.mockResolvedValue(null)
  })

  const openSecurity = async () => {
    render(<Profile />)
    fireEvent.click(await screen.findByRole('button', { name: /الأمان/ }))
  }

  it('saves name and email through updateProfile and mirrors all fields into settings', async () => {
    render(<Profile />)

    const nameInput = await screen.findByLabelText('الاسم الكامل')
    fireEvent.change(nameInput, { target: { value: 'محمد العتيبي' } })
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), {
      target: { value: 'm.alotaibi@kafeel.sa' },
    })

    fireEvent.click(screen.getByRole('button', { name: /حفظ البيانات/ }))

    // The real identity (topbar/sidebar/login) goes through the auth session.
    await waitFor(() =>
      expect(authMocks.updateProfile).toHaveBeenCalledWith('محمد العتيبي', 'm.alotaibi@kafeel.sa'),
    )
    // Phone + bio (and a mirror of name/email) are persisted in the settings store.
    expect(api.updateSettings).toHaveBeenCalledWith({
      'profile.name': 'محمد العتيبي',
      'profile.email': 'm.alotaibi@kafeel.sa',
      'profile.phone': '0550000000',
      'profile.bio': expect.stringContaining('مدير منصة كفيل'),
    })
    expect(screen.getByText(/تم حفظ بيانات الحساب بنجاح/)).toBeInTheDocument()
  })

  it('does not call updateProfile when only phone/bio changed', async () => {
    render(<Profile />)

    fireEvent.change(await screen.findByLabelText('رقم الجوال'), {
      target: { value: '0551111111' },
    })
    fireEvent.click(screen.getByRole('button', { name: /حفظ البيانات/ }))

    await waitFor(() =>
      expect(api.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ 'profile.phone': '0551111111' }),
      ),
    )
    expect(authMocks.updateProfile).not.toHaveBeenCalled()
    expect(screen.getByText(/تم حفظ بيانات الحساب بنجاح/)).toBeInTheDocument()
  })

  it('shows an error notice when the profile update fails', async () => {
    authMocks.updateProfile.mockRejectedValueOnce(new Error('تعذر حفظ البيانات'))
    render(<Profile />)

    // Change the name so the save actually attempts the identity update.
    fireEvent.change(await screen.findByLabelText('الاسم الكامل'), {
      target: { value: 'اسم آخر' },
    })
    fireEvent.click(screen.getByRole('button', { name: /حفظ البيانات/ }))

    expect(await screen.findByText(/تعذر حفظ البيانات/)).toBeInTheDocument()
    expect(api.updateSettings).not.toHaveBeenCalled()
  })

  it('falls back to the auth-session name when settings lack profile.name', async () => {
    api.settings.mockResolvedValue({ 'profile.email': 'admin@kafeel.sa' }) // no profile.name key
    render(<Profile />)

    // Account tab is the default — the header card must show the session name,
    // not a hardcoded constant.
    expect(await screen.findByText('عبدالرحمن السالم')).toBeInTheDocument()
  })

  it('loads and renders the real login sessions', async () => {
    await openSecurity()

    expect(await screen.findByText('Chrome على Linux')).toBeInTheDocument()
    expect(screen.getByText('الجلسة الحالية')).toBeInTheDocument()
    expect(screen.getByText('iPhone 15 Pro — Safari')).toBeInTheDocument()
    expect(screen.getByText(/الرياض، السعودية/)).toBeInTheDocument()
    expect(api.loginSessions).toHaveBeenCalledTimes(1)
  })

  it('terminates a session through the API and removes it from the list', async () => {
    await openSecurity()

    fireEvent.click(screen.getByRole('button', { name: /إنهاء الجلسة/ }))

    await waitFor(() => expect(api.terminateSession).toHaveBeenCalledWith(2))
    await waitFor(() => expect(screen.queryByText('iPhone 15 Pro — Safari')).not.toBeInTheDocument())
    expect(screen.getByText(/تم إنهاء الجلسة بنجاح/)).toBeInTheDocument()
  })

  it('keeps the current session intact and never offers to terminate it', async () => {
    await openSecurity()

    expect(screen.getByText('Chrome على Linux')).toBeInTheDocument()
    // Only the non-current session has a terminate button.
    expect(screen.getAllByRole('button', { name: /إنهاء الجلسة/ })).toHaveLength(1)
    expect(api.terminateSession).not.toHaveBeenCalled()
  })

  it('marks terminated sessions with a badge and offers no terminate button', async () => {
    api.loginSessions.mockResolvedValue([currentSession, terminatedSession])
    await openSecurity()

    expect(screen.getByText('Chrome على Windows')).toBeInTheDocument()
    expect(screen.getByText('منتهية')).toBeInTheDocument()
    // The terminated session must not look actionable.
    expect(screen.queryAllByRole('button', { name: /إنهاء الجلسة/ })).toHaveLength(0)
    expect(api.terminateSession).not.toHaveBeenCalled()
  })

  it('persists the 2FA toggle to the settings store', async () => {
    await openSecurity()

    const toggle = screen.getByRole('switch', { name: /المصادقة الثنائية/ })
    fireEvent.click(toggle)

    await waitFor(() => expect(api.updateSettings).toHaveBeenCalledWith({ 'security.twoFa': 'false' }))
    expect(screen.getByText(/تم إيقاف المصادقة الثنائية/)).toBeInTheDocument()
  })

  it('reverts the 2FA toggle when the save fails', async () => {
    api.updateSettings.mockRejectedValueOnce(new Error('تعذر حفظ الإعدادات'))
    await openSecurity()

    const toggle = screen.getByRole('switch', { name: /المصادقة الثنائية/ })
    fireEvent.click(toggle)

    expect(await screen.findByText(/تعذر حفظ الإعدادات/)).toBeInTheDocument()
    // The switch went back to on — it reflects the persisted value.
    expect(screen.getByRole('switch', { name: /المصادقة الثنائية/ })).toBeChecked()
  })
})

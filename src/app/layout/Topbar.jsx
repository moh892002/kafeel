import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { useAuth } from '../../useAuth'
import { api } from '../../api'
import { timeAgo } from '../../utils/format'
import { TYPE_ICON, TYPE_TILE } from '../../utils/notificationStyle'

const RECENT_LIMIT = 6

export default function Topbar({ onMenu }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const bellRef = useRef(null)
  // Fixed-position coordinates for the panel, measured from the bell button and
  // clamped to the viewport so it can never overflow the page on narrow screens.
  const [notifPos, setNotifPos] = useState(null)

  const measureNotifPanel = useCallback(() => {
    const btn = bellRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const width = Math.min(384, window.innerWidth - 16)
    // The bell sits near the viewport's inline-end (left in RTL) and the panel
    // grows toward inline-start; clamp both edges into the viewport.
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8))
    setNotifPos({ top: Math.round(rect.bottom) + 8, left: Math.round(left), width })
  }, [])

  // Re-measure while open (window resize / zoom) so the panel stays attached.
  useEffect(() => {
    if (!showNotif) return undefined
    window.addEventListener('resize', measureNotifPanel)
    return () => window.removeEventListener('resize', measureNotifPanel)
  }, [showNotif, measureNotifPanel])

  // Guards against a stale refresh clobbering a newer local action
  // (e.g. mark-all-read landing while the open-dropdown fetch is in flight).
  const loadVersion = useRef(0)

  const loadNotifs = useCallback(async () => {
    const version = ++loadVersion.current
    setNotifLoading(true)
    try {
      const list = await api.notifications()
      if (version === loadVersion.current) setNotifs(list ?? [])
    } catch {
      /* badge keeps its last value — a failed fetch must not break the header */
    } finally {
      if (version === loadVersion.current) setNotifLoading(false)
    }
  }, [])

  // Initial load for the badge; refetch on navigation (the Notifications page
  // may have changed read state while Topbar stayed mounted in the layout) and
  // on each open so the count is fresh.
  useEffect(() => {
    loadNotifs()
  }, [loadNotifs, location.pathname])

  const unread = notifs.filter((n) => !n.read).length
  // Preview panel — the badge counts ALL unread while the panel shows the
  // newest few (unread first), so the two may legitimately differ.
  const recent = useMemo(
    () =>
      [...notifs]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .sort((a, b) => Number(a.read) - Number(b.read)) // unread first
        .slice(0, RECENT_LIMIT),
    [notifs]
  )

  const openNotif = (n) => {
    setShowNotif(false)
    loadVersion.current += 1 // discard any in-flight refresh
    if (!n.read) {
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      api.markNotificationRead(n.id, true).catch(() => {})
    }
    navigate('/notifications')
  }

  const markAll = async () => {
    loadVersion.current += 1 // discard any in-flight refresh
    const prev = notifs
    setNotifs((p) => p.map((n) => ({ ...n, read: true })))
    try {
      await api.markAllNotificationsRead()
    } catch {
      setNotifs(prev) // revert on failure, same as the Notifications page
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        {/* Menu + title (start = right in RTL) */}
        <button
          className="grid size-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-mint hover:text-primary lg:hidden"
          onClick={onMenu}
          aria-label="فتح القائمة"
        >
          <Icon name="menu" size={22} />
        </button>
        {/* Search — on the right (start) in RTL */}
        <div className="relative hidden md:block">
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute inset-s-3.5 top-1/2 -translate-y-1/2 text-ink-mute"
          />
          <input
            placeholder="بحث سريع..."
            className="w-56 rounded-xl border border-line bg-surface py-2.5 pe-4 ps-10 text-sm text-ink placeholder:text-ink-mute transition-all focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 lg:w-64"
          />
        </div>
        <div className="flex-1" />
        {/* Notifications */}
        <div className="relative">
          <button
            ref={bellRef}
            className="relative grid size-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-mint hover:text-primary"
            aria-label="الإشعارات"
            aria-haspopup="true"
            aria-expanded={showNotif}
            onClick={() => {
              measureNotifPanel()
              setShowNotif((v) => !v)
              if (!showNotif) loadNotifs()
            }}
          >
            <Icon name="bell" size={20} />
            {unread > 0 && (
              <span className="absolute -end-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-[#e04545] px-1 py-px text-[10px] font-extrabold leading-tight text-white ring-2 ring-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {showNotif && notifPos && (
            <>
              {/* The header's backdrop-blur makes it the containing block for fixed
                  children, so cover the whole viewport explicitly (vw/vh units are
                  always viewport-relative). */}
              <div
                className="fixed z-10"
                style={{ top: 0, left: 0, width: '100vw', height: '100vh' }}
                onClick={() => setShowNotif(false)}
              />
              <div
                data-testid="notif-panel"
                className="fixed z-20 overflow-hidden rounded-2xl border border-line bg-white shadow-pop"
                style={notifPos}
              >
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-sm font-extrabold text-ink">الإشعارات</p>
                  {unread > 0 && (
                    <button
                      onClick={markAll}
                      className="flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-primary-dark"
                    >
                      <Icon name="check" size={13} strokeWidth={2.4} />
                      تعيين الكل كمقروء
                    </button>
                  )}
                </div>

                {/* List */}
                <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                  {notifLoading && notifs.length === 0 ? (
                    <li className="flex items-center justify-center gap-2 px-4 py-10 text-xs font-bold text-ink-mute">
                      <Icon name="loader" size={14} className="animate-spin" />
                      جارٍ تحميل الإشعارات...
                    </li>
                  ) : recent.length === 0 ? (
                    <li className="px-4 py-10 text-center text-xs font-semibold text-ink-mute">
                      لا توجد إشعارات بعد
                    </li>
                  ) : (
                    recent.map((n) => (
                      <li key={n.id}>
                        <button
                          onClick={() => openNotif(n)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-mint/40"
                        >
                          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${TYPE_TILE[n.type] ?? 'bg-mint text-primary'}`}>
                            <Icon name={TYPE_ICON[n.type] ?? 'bell'} size={16} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm ${n.read ? 'font-semibold text-ink-soft' : 'font-extrabold text-ink'}`}>
                              {n.title}
                            </span>
                            <span className="mt-0.5 line-clamp-1 block text-xs text-ink-mute">{n.body}</span>
                            <span className="mt-0.5 block text-[10px] font-semibold text-ink-mute/70">{timeAgo(n.time)}</span>
                          </span>
                          {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />}
                        </button>
                      </li>
                    ))
                  )}
                </ul>

                {/* Footer */}
                <button
                  onClick={() => {
                    setShowNotif(false)
                    navigate('/notifications')
                  }}
                  className="flex w-full items-center justify-center gap-2 border-t border-line px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-mint"
                >
                  عرض كل الإشعارات
                  <Icon name="chevron-left" size={15} />
                </button>
              </div>
            </>
          )}
        </div>
        <div className="h-8 w-px bg-line" />
        {/* User */}
        <div className="relative">
          <button
            className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-surface"
            onClick={() => setShowUserMenu((v) => !v)}
          >
            <span className="grid size-9 place-items-center rounded-full bg-linear-to-br from-accent to-accent-soft text-xs font-extrabold text-white">
              {(admin?.name ?? 'م').charAt(0)}
            </span>
            <span className="hidden text-start sm:block">
              <span className="block text-sm font-bold leading-tight text-ink">
                {admin?.name ?? 'المدير'}
              </span>
              <span className="block text-[11px] leading-tight text-ink-mute">
                مدير المنصة
              </span>
            </span>
            <Icon name="chevron-down" size={16} className="text-ink-mute" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed z-10"
                style={{ top: 0, left: 0, width: '100vw', height: '100vh' }}
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute inset-inline-end z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-mint"
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/profile')
                  }}
                >
                  <Icon name="user" size={18} className="text-primary" />
                  الحساب الشخصي
                </button>
                <button
                  className="flex w-full items-center gap-2.5 border-t border-line px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                  onClick={() => {
                    setShowUserMenu(false)
                    logout()
                    navigate('/login')
                  }}
                >
                  <Icon name="logout" size={18} />
                  تسجيل الخروج
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

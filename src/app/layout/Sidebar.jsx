import { NavLink, useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import { NAV_SECTIONS } from '@/app/nav'
import { useAuth } from '@/features/auth/useAuth'

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const { admin, logout } = useAuth()
  const name = admin?.name ?? 'المدير'
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-primary-dark/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-72 flex-col bg-primary transition-transform duration-300 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
        style={{ boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-5">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-soft text-white shadow-lg">
            <Icon name="shield" size={24} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xl font-extrabold leading-none text-white">كفيل</p>
            <p className="mt-1 text-[11px] font-medium text-white/50">منصة كفيل الإدارية</p>
          </div>
        </div>

        <div className="mx-6 mb-4 h-px bg-white/10" />

        {/* Nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label ?? 'main'}>
              {section.label && (
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/35">
                  {section.label}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-white/10 text-white shadow-[inset_3px_0_0_0_#75bcba]'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <Icon
                        name={item.icon}
                        size={20}
                        className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                      />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer user card */}
        <div className="m-4 mt-2 rounded-2xl bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-extrabold text-primary-dark">
              {name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{name}</p>
              <p className="truncate text-[11px] text-white/50">مدير المنصة</p>
            </div>
            <button
              className="grid size-9 shrink-0 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

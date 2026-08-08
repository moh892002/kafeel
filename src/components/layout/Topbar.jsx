import { useNavigate } from "react-router-dom";
import Icon from "../ui/Icon";
import { useState } from "react";

export default function Topbar({ onMenu }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

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
        <div className="flex-1" />w{/* Notifications */}
        <button
          className="relative grid size-10 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-mint hover:text-primary"
          aria-label="الإشعارات"
        >
          <Icon name="bell" size={20} />
          <span className="absolute inset-e-2.5 top-2.5 size-2 rounded-full bg-[#e04545] ring-2 ring-white" />
        </button>
        <div className="h-8 w-px bg-line" />
        {/* User */}
        <div className="relative">
          <button
            className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-surface"
            onClick={() => setShowUserMenu((v) => !v)}
          >
            <span className="grid size-9 place-items-center rounded-full bg-linear-to-br from-accent to-accent-soft text-xs font-extrabold text-white">
              م
            </span>
            <span className="hidden text-start sm:block">
              <span className="block text-sm font-bold leading-tight text-ink">
                محمد العتيبي
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
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute inset-inline-end z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-mint"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate("/profile");
                  }}
                >
                  <Icon name="user" size={18} className="text-primary" />
                  الحساب الشخصي
                </button>
                <button className="flex w-full items-center gap-2.5 border-t border-line px-4 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50">
                  <Icon name="logout" size={18} />
                  تسجيل الخروج
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

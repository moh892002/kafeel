import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { api } from '../api'
import { options, useMeta } from '../meta'
import { num, timeAgo } from '../utils/format'
import { TYPE_ICON, TYPE_TILE, TYPE_TONE } from '../utils/notificationStyle'

/* ---------- Page ---------- */
export default function Notifications() {
  const meta = useMeta()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('الكل')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const list = await api.notifications()
        if (cancelled) return
        setItems(list ?? [])
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const typeLabels = options(meta, 'notificationType')
  const counts = useMemo(() => {
    const c = { 'الكل': items.length, 'غير مقروء': 0 }
    typeLabels.forEach((t) => {
      c[t] = 0
    })
    items.forEach((n) => {
      if (!n.read) c['غير مقروء'] += 1
      c[n.type] = (c[n.type] ?? 0) + 1
    })
    return c
  }, [items, typeLabels])

  const rows = useMemo(() => {
    if (filter === 'الكل') return items
    if (filter === 'غير مقروء') return items.filter((n) => !n.read)
    return items.filter((n) => n.type === filter)
  }, [items, filter])

  const markAllRead = async () => {
    const prev = items
    setItems((p) => p.map((n) => ({ ...n, read: true })))
    try {
      await api.markAllNotificationsRead()
    } catch {
      setItems(prev) // revert on failure
    }
  }

  const open = async (n) => {
    setSelected(n)
    if (n.read) return
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    try {
      await api.markNotificationRead(n.id, true)
    } catch {
      /* keep the optimistic local state */
    }
  }

  const remove = async (id) => {
    const prev = items
    setItems((p) => p.filter((n) => n.id !== id))
    try {
      await api.deleteNotification(id)
    } catch {
      setItems(prev)
    }
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-red-50 text-red-500">
          <Icon name="x" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">تعذر تحميل الإشعارات</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{error}</p>
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري تحميل الإشعارات...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">إشعارات النظام</h2>
          <p className="mt-1 text-sm text-ink-soft">أحدث الإشعارات عن الحجوزات والمدفوعات والتقييمات</p>
        </div>
        <Button variant="outline" icon={<Icon name="check" size={17} />} onClick={markAllRead} disabled={counts['غير مقروء'] === 0}>
          تعيين الكل كمقروء
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {['الكل', 'غير مقروء', ...typeLabels].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-2xl border px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 ${
              filter === s
                ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(7,94,102,0.35)]'
                : 'border-line bg-card shadow-card hover:shadow-pop'
            }`}
          >
            <p className={`text-2xl font-extrabold ${filter === s ? 'text-white' : s === 'غير مقروء' ? 'text-amber-500' : 'text-ink'}`}>
              {num(counts[s] ?? 0)}
            </p>
            <p className={`text-xs font-semibold ${filter === s ? 'text-white/70' : s === 'غير مقروء' ? 'text-amber-500' : 'text-ink-mute'}`}>
              {s === 'الكل' ? 'إجمالي الإشعارات' : s === 'غير مقروء' ? 'إشعار غير مقروء' : s}
            </p>
          </button>
        ))}
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-20 text-center">
          <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
            <Icon name="inbox" size={38} strokeWidth={1.6} />
          </div>
          <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد إشعارات</h3>
          <p className="mt-1.5 max-w-sm text-sm text-ink-soft">ستظهر هنا جميع الإشعارات الجديدة فور حدوثها.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3.5 px-5 py-4 transition-colors hover:bg-mint/30 ${n.read ? '' : 'bg-mint/25'}`}
              >
                <button onClick={() => open(n)} className="flex min-w-0 flex-1 items-start gap-3.5 text-start">
                  <span className={`relative grid size-11 shrink-0 place-items-center rounded-xl ${TYPE_TILE[n.type]}`}>
                    <Icon name={TYPE_ICON[n.type]} size={20} />
                    {!n.read && <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-amber-400 ring-2 ring-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm ${n.read ? 'font-semibold text-ink-soft' : 'font-extrabold text-ink'}`}>{n.title}</span>
                      <Badge tone={TYPE_TONE[n.type]} compact>{n.type}</Badge>
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm text-ink-mute">{n.body}</span>
                    <span className="mt-1 block text-[11px] font-semibold text-ink-mute/70">{timeAgo(n.time)}</span>
                  </span>
                </button>
                <button
                  title="حذف الإشعار"
                  aria-label="حذف"
                  onClick={() => remove(n.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Detail modal */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.title} subtitle={timeAgo(selected.time)} size="sm">
          <div className="flex items-start gap-3">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${TYPE_TILE[selected.type]}`}>
              <Icon name={TYPE_ICON[selected.type]} size={20} />
            </span>
            <div>
              <Badge tone={TYPE_TONE[selected.type]} compact>{selected.type}</Badge>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{selected.body}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

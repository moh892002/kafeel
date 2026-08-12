import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import PageState from '@/components/ui/PageState'
import Badge from '@/components/ui/Badge'
import Icon from '@/components/ui/Icon'
import PageHeader from '@/components/ui/PageHeader'
import StatStrip from '@/components/ui/StatStrip'
import { api } from '@/app/api'
import useAsync from '@/hooks/useAsync'
import NotificationViewModal from './components/NotificationViewModal'
import { options, useMeta } from '@/app/meta'
import { num, timeAgo } from '@/utils/format'
import { TYPE_ICON, TYPE_TILE, TYPE_TONE } from '@/utils/notificationStyle'

/* ---------- Page ---------- */
export default function Notifications() {
  const meta = useMeta()
  const [filter, setFilter] = useState('الكل')
  const [selected, setSelected] = useState(null)

  const { data: items, setData: setItems, loading, error, reload } = useAsync(
    () => api.notifications().then((l) => l ?? []),
    [],
    [],
  )

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
      <PageState
        mode="error"
        title="تعذر تحميل الإشعارات"
        message={error}
        onRetry={reload}
      />
    )
  }

  if (loading) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل الإشعارات..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="إشعارات النظام"
        subtitle="أحدث الإشعارات عن الحجوزات والمدفوعات والتقييمات"
        actions={
          <Button variant="outline" icon={<Icon name="check" size={17} />} onClick={markAllRead} disabled={counts['غير مقروء'] === 0}>
            تعيين الكل كمقروء
          </Button>
        }
      />

      {/* Stat strip */}
      <StatStrip
        cols="sm:grid-cols-3 xl:grid-cols-6"
        active={filter}
        onSelect={setFilter}
        items={['الكل', 'غير مقروء', ...typeLabels].map((s) => ({
          key: s,
          value: num(counts[s] ?? 0),
          label: s === 'الكل' ? 'إجمالي الإشعارات' : s === 'غير مقروء' ? 'إشعار غير مقروء' : s,
          valueClass: s === 'غير مقروء' ? 'text-amber-500' : undefined,
          labelClass: s === 'غير مقروء' ? 'text-amber-500' : undefined,
        }))}
      />

      {/* List */}
      {rows.length === 0 ? (
        <PageState
          mode="empty"
          icon="inbox"
          title="لا توجد إشعارات"
          message="ستظهر هنا جميع الإشعارات الجديدة فور حدوثها."
        />
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
      {selected && <NotificationViewModal notification={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { Input, Select } from '../components/ui/Input'
import { CLIENTS, CITIES } from '../data/clients'
import { fmtDate, num } from '../utils/format'

const PAGE_SIZE = 8
const STATUS_TONE = { نشط: 'success', 'غير نشط': 'neutral' }

const pad = (n) => String(n).padStart(2, '0')
const localDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const SORT_OPTIONS = [
  { key: 'joinedAt', dir: 'desc', label: 'الأحدث انضماماً' },
  { key: 'sessions', dir: 'desc', label: 'الأكثر جلسات' },
  { key: 'spent', dir: 'desc', label: 'الأعلى إنفاقاً' },
  { key: 'name', dir: 'asc', label: 'الاسم' },
]

const ACTIVITY_TONE = {
  'حجز جلسة': 'teal',
  'دفع رسوم': 'soft',
  'تقييم أخصائي': 'warning',
  'انضمام للقاء': 'mint',
  'تسجيل في برنامج': 'success',
}

const STAT_CARDS = [
  { key: 'الكل', label: 'إجمالي العملاء' },
  { key: 'نشط', label: 'عميل نشط' },
  { key: 'جديد', label: 'انضم هذا الشهر' },
  { key: 'مميز', label: 'عملاء مميزون' },
]

/* ---------- Profile modal ---------- */
function ClientProfileModal({ client, onClose }) {
  const c = client
  return (
    <Modal
      open
      onClose={onClose}
      title="ملف العميل"
      subtitle={c.email}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          <Button
            icon={<Icon name="chat" size={16} />}
            onClick={() => {
              window.location.href = `mailto:${c.email}`
            }}
          >
            مراسلة العميل
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={c.name} size={64} rounded="rounded-2xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-extrabold text-ink">{c.name}</h4>
              {c.vip && <Badge tone="warning" icon="star">عميل مميز</Badge>}
              <Badge tone={STATUS_TONE[c.status]} dot>{c.status}</Badge>
            </div>
            <p className="mt-1 text-sm font-semibold text-ink-soft">{c.city}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: 'clipboard', label: 'الجلسات', value: num(c.sessions) },
            { icon: 'wallet', label: 'إجمالي الإنفاق', value: `${num(c.spent)} ر.س` },
            { icon: 'star', label: 'التقييم', value: c.rating.toFixed(1) },
            { icon: 'calendar', label: 'آخر زيارة', value: fmtDate(c.lastVisit) },
          ].map((x) => (
            <div key={x.label} className="rounded-xl border border-line bg-white px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-mute">
                <Icon name={x.icon} size={13} className="text-primary" />
                {x.label}
              </p>
              <p className="mt-1 truncate text-sm font-extrabold text-ink">{x.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft">
            <Icon name="phone" size={14} className="text-primary" />
            {c.phone}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft">
            <Icon name="mail" size={14} className="text-primary" />
            {c.email}
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft">
            <Icon name="calendar" size={14} className="text-primary" />
            انضم في {fmtDate(c.joinedAt)}
          </span>
        </div>

        <div>
          <p className="mb-2 text-sm font-extrabold text-ink">آخر النشاطات</p>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {c.activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <Badge tone={ACTIVITY_TONE[a.type]} compact>{a.type}</Badge>
                <span className="text-xs font-semibold text-ink-mute">{fmtDate(a.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Page ---------- */
export default function Clients() {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('الكل')
  const [stat, setStat] = useState('الكل')
  const [sort, setSort] = useState('joinedAt:desc')
  const [page, setPage] = useState(1)
  const [profile, setProfile] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const now = useMemo(() => new Date(), [])
  const monthAgo = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    return localDateStr(d) // local date, matching the joinedAt format
  }, [now])

  const counts = useMemo(() => {
    const c = { الكل: CLIENTS.length, نشط: 0, جديد: 0, مميز: 0 }
    CLIENTS.forEach((x) => {
      if (x.status === 'نشط') c['نشط'] += 1
      if (x.joinedAt >= monthAgo) c['جديد'] += 1
      if (x.vip) c['مميز'] += 1
    })
    return c
  }, [monthAgo])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const [skey, sdir] = sort.split(':')
    const list = CLIENTS.filter((c) => {
      if (stat === 'نشط' && c.status !== 'نشط') return false
      if (stat === 'جديد' && c.joinedAt < monthAgo) return false
      if (stat === 'مميز' && !c.vip) return false
      if (city !== 'الكل' && c.city !== city) return false
      if (q && !`${c.name} ${c.email} ${c.city}`.toLowerCase().includes(q)) return false
      return true
    })
    return [...list].sort((a, b) => {
      const cmp = skey === 'name' ? a.name.localeCompare(b.name, 'ar') : a[skey] < b[skey] ? -1 : a[skey] > b[skey] ? 1 : 0
      return sdir === 'asc' ? cmp : -cmp
    })
  }, [search, city, stat, sort, monthAgo])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const exportCsv = () => {
    const header = ['الاسم', 'البريد', 'الهاتف', 'المدينة', 'الجلسات', 'الإنفاق (ر.س)', 'التقييم', 'الحالة', 'تاريخ الانضمام']
    const lines = rows.map((r) => [r.name, r.email, r.phone, r.city, r.sessions, r.spent, r.rating, r.status, r.joinedAt].join(','))
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clients.csv'
    a.click()
    URL.revokeObjectURL(url)
    setNotice('تم تصدير الملف بنجاح ✓')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">العملاء</h2>
          <p className="mt-1 text-sm text-ink-soft">متابعة عملاء المنصة وإنفاقهم ونشاطهم</p>
        </div>
        <Button variant="outline" icon={<Icon name="download" size={17} />} onClick={exportCsv}>
          تصدير CSV
        </Button>
      </div>

      {/* Notice */}
      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent-soft/30 bg-mint px-4 py-3 text-sm font-bold text-primary animate-slide-in">
          <span className="flex items-center gap-2">
            <Icon name="check" size={16} strokeWidth={2.4} />
            {notice}
          </span>
          <button onClick={() => setNotice(null)} aria-label="إغلاق" className="grid size-6 place-items-center rounded-md transition-colors hover:bg-accent/30">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setStat(s.key)
              setPage(1)
            }}
            className={`rounded-2xl border px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 ${
              stat === s.key ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(7,94,102,0.35)]' : 'border-line bg-card shadow-card hover:shadow-pop'
            }`}
          >
            <p className={`text-2xl font-extrabold ${stat === s.key ? 'text-white' : 'text-ink'}`}>{num(counts[s.key])}</p>
            <p className={`text-xs font-semibold ${stat === s.key ? 'text-white/70' : 'text-ink-mute'}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              icon="search"
              placeholder="ابحث بالاسم أو البريد أو المدينة..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select className="w-40" value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }}>
            <option value="الكل">كل المدن</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select className="w-44" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
            {SORT_OPTIONS.map((o) => (
              <option key={`${o.key}:${o.dir}`} value={`${o.key}:${o.dir}`}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
              <Icon name="users" size={38} strokeWidth={1.6} />
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد نتائج مطابقة</h3>
            <p className="mt-1.5 max-w-sm text-sm text-ink-soft">جرّب تعديل البحث أو الفلاتر لعرض جميع العملاء.</p>
            <Button variant="outline" className="mt-5" onClick={() => { setSearch(''); setCity('الكل'); setStat('الكل'); setPage(1) }}>
              إعادة تعيين الفلاتر
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                  <th className="px-5 py-3 text-start">العميل</th>
                  <th className="px-4 py-3 text-start">المدينة</th>
                  <th className="px-4 py-3 text-start">الجلسات</th>
                  <th className="px-4 py-3 text-start">الإنفاق</th>
                  <th className="px-4 py-3 text-start">التقييم</th>
                  <th className="px-4 py-3 text-start">آخر زيارة</th>
                  <th className="px-4 py-3 text-start">الحالة</th>
                  <th className="px-5 py-3 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-mint/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size={40} />
                        <div>
                          <p className="flex items-center gap-1.5 font-bold text-ink">
                            {c.name}
                            {c.vip && <Icon name="star" size={13} className="text-amber-400" />}
                          </p>
                          <p className="text-xs text-ink-mute">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink-soft">{c.city}</td>
                    <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(c.sessions)}</td>
                    <td className="px-4 py-3.5 font-extrabold text-ink">{num(c.spent)} ر.س</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-extrabold text-ink">
                        <Icon name="star" size={14} className="text-amber-400" />
                        {c.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-ink-soft">{fmtDate(c.lastVisit)}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone={STATUS_TONE[c.status]} dot>{c.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end">
                        <button
                          title="عرض الملف"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                          onClick={() => setProfile(c)}
                        >
                          <Icon name="eye" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && <Pagination page={safePage} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} />}
      </Card>

      {/* Profile modal */}
      {profile && <ClientProfileModal client={profile} onClose={() => setProfile(null)} />}
    </div>
  )
}

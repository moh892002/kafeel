import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import PageState from '@/components/ui/PageState'
import Icon from '@/components/ui/Icon'
import Notice from '@/components/ui/Notice'
import PageHeader from '@/components/ui/PageHeader'
import StatStrip from '@/components/ui/StatStrip'
import { api } from '@/app/api'
import { num } from '@/utils/format'
import ClientProfileModal from './components/ClientProfileModal'
import ClientsToolbar from './components/ClientsToolbar'
import ClientsTable from './components/ClientsTable'

const PAGE_SIZE = 8

const pad = (n) => String(n).padStart(2, '0')
const localDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const STAT_CARDS = [
  { key: 'الكل', label: 'إجمالي العملاء' },
  { key: 'نشط', label: 'عميل نشط' },
  { key: 'جديد', label: 'انضم هذا الشهر' },
  { key: 'مميز', label: 'عملاء مميزون' },
]

/* ---------- Page ---------- */
export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('الكل')
  const [stat, setStat] = useState('الكل')
  const [sort, setSort] = useState('joinedAt:desc')
  const [page, setPage] = useState(1)
  const [profile, setProfile] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.clients()
      .then((rows) => {
        if (cancelled) return
        setClients(rows)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const CITIES = useMemo(() => ['الكل', ...new Set(clients.map((c) => c.city).filter(Boolean))], [clients])

  const now = useMemo(() => new Date(), [])
  const monthAgo = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    return localDateStr(d) // local date, matching the joinedAt format
  }, [now])

  const counts = useMemo(() => {
    const c = { الكل: clients.length, نشط: 0, جديد: 0, مميز: 0 }
    clients.forEach((x) => {
      if (x.status === 'نشط') c['نشط'] += 1
      if (x.joinedAt >= monthAgo) c['جديد'] += 1
      if (x.vip) c['مميز'] += 1
    })
    return c
  }, [clients, monthAgo])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const [skey, sdir] = sort.split(':')
    const list = clients.filter((c) => {
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
  }, [clients, search, city, stat, sort, monthAgo])

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

  if (error) {
    return (
      <PageState
        mode="error"
        title="تعذر تحميل العملاء"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="العملاء"
        subtitle="متابعة عملاء المنصة وإنفاقهم ونشاطهم"
        actions={
          <Button variant="outline" icon={<Icon name="download" size={17} />} onClick={exportCsv}>
            تصدير CSV
          </Button>
        }
      />

      {/* Notice */}
      {notice && <Notice text={notice} onDismiss={() => setNotice(null)} />}

      {/* Stat strip */}
      <StatStrip
        cols="lg:grid-cols-4"
        active={stat}
        onSelect={(k) => {
          setStat(k)
          setPage(1)
        }}
        items={STAT_CARDS.map((s) => ({
          key: s.key,
          value: num(counts[s.key]),
          label: s.label,
        }))}
      />

      <ClientsToolbar
        search={search}
        onSearchChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        city={city}
        onCityChange={(e) => {
          setCity(e.target.value)
          setPage(1)
        }}
        cities={CITIES}
        sort={sort}
        onSortChange={(e) => {
          setSort(e.target.value)
          setPage(1)
        }}
      />

      <ClientsTable
        rows={paged}
        loading={loading}
        page={safePage}
        pageSize={PAGE_SIZE}
        total={rows.length}
        onPageChange={setPage}
        onView={setProfile}
        onResetFilters={() => {
          setSearch('')
          setCity('الكل')
          setStat('الكل')
          setPage(1)
        }}
      />

      {/* Profile modal */}
      {profile && <ClientProfileModal client={profile} onClose={() => setProfile(null)} />}
    </div>
  )
}

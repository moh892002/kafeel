import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { Input, Select } from '../components/ui/Input'
import { api } from '../api'
import { allFilter, options, statusChoices, useMeta } from '../meta'
import { fmtDate, localDateStr, num } from '../utils/format'

const PAGE_SIZE = 8

/* ---------- Add / edit transaction modal ---------- */
function TransactionModal({ editing, clients, onClose, onSaved }) {
  const meta = useMeta()
  const methods = options(meta, 'paymentMethod')
  const tx = editing ?? {}
  const [form, setForm] = useState({
    clientName: tx.client ?? '',
    service: tx.service ?? '',
    method: tx.method ?? methods[0] ?? 'مدى',
    date: tx.date ?? localDateStr(new Date()),
    amount: tx.amount != null ? String(tx.amount) : '',
    commission: tx.commission != null ? String(tx.commission) : '',
    status: tx.status ?? options(meta, 'transactionStatus')[0] ?? 'مكتمل',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.service.trim()) {
      setError('يرجى إدخال اسم الخدمة')
      return
    }
    if (!form.date) {
      setError('يرجى اختيار تاريخ المعاملة')
      return
    }
    const amount = Number(form.amount)
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر')
      return
    }
    setSubmitting(true)
    try {
      // Resolve the client id when the typed name matches a registered client.
      const matched = clients.find((c) => c.name === form.clientName.trim())
      const body = {
        clientName: form.clientName.trim() || null,
        clientId: matched?.id ?? null,
        service: form.service.trim(),
        method: form.method,
        date: form.date,
        amount,
        commission: form.commission === '' ? null : Number(form.commission),
        status: form.status,
      }
      const saved = editing ? await api.updateTransaction(editing.id, body) : await api.createTransaction(body)
      onSaved(saved)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? 'تعديل المعاملة' : 'إضافة معاملة'}
      subtitle={editing ? `المرجع ${editing.reference ?? '—'}` : 'سجّل دفعة مالية من عميل على خدمة معينة'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="check" size={16} />} onClick={save} disabled={submitting}>
            {submitting ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المعاملة'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-slide-in">
            <Icon name="x" size={16} strokeWidth={2.4} />
            {error}
          </div>
        )}

        <div>
          <Input
            id="tx-client"
            label="اسم العميل"
            list="tx-client-names"
            placeholder="اختر من القائمة أو اكتب الاسم..."
            value={form.clientName}
            onChange={set('clientName')}
            icon="user"
          />
          <datalist id="tx-client-names">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="الخدمة *" id="tx-service" placeholder="مثال: جلسة استشارية" value={form.service} onChange={set('service')} icon="clipboard" />
          <Select label="طريقة الدفع" id="tx-method" icon="banknote" value={form.method} onChange={set('method')}>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input label="التاريخ *" id="tx-date" type="date" value={form.date} onChange={set('date')} />
          <Select label="الحالة" id="tx-status" icon="target" value={form.status} onChange={set('status')}>
            {options(meta, 'transactionStatus').map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Input label="المبلغ (ر.س) *" id="tx-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} icon="wallet" />
          <Input
            label="العمولة (ر.س)"
            id="tx-commission"
            type="number"
            min="0"
            step="0.01"
            placeholder="افتراضي 15% من المبلغ"
            value={form.commission}
            onChange={set('commission')}
          />
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Page ---------- */
export default function Transactions() {
  const meta = useMeta()
  const [transactions, setTransactions] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('الكل')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // null | 'new' | transaction being edited
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusBusy, setStatusBusy] = useState(null)
  const [notice, setNotice] = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  // The endpoint filters server-side by search/status/date range — debounce the
  // toolbar so typing doesn't fire a request per keystroke.
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const list = await api.transactions({
          search: search.trim() || undefined,
          status: status === 'الكل' ? undefined : status,
          from: from || undefined,
          to: to || undefined,
        })
        if (cancelled) return
        setTransactions(list ?? [])
        setError(null)
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, from, to, refresh])

  // Reference clients for the modal's autocomplete — a failed fetch must not
  // break the page (names can always be typed freely).
  useEffect(() => {
    let cancelled = false
    api
      .clients()
      .then((list) => {
        if (!cancelled) setClients(list ?? [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const statuses = allFilter(options(meta, 'transactionStatus'))
  const counts = useMemo(() => {
    const c = { الكل: transactions.length }
    statuses.forEach((s) => {
      if (s !== 'الكل') c[s] = 0
    })
    transactions.forEach((x) => {
      c[x.status] = (c[x.status] ?? 0) + 1
    })
    return c
  }, [transactions, statuses])

  const totals = useMemo(() => {
    let amount = 0
    let commission = 0
    transactions.forEach((t) => {
      amount += Number(t.amount ?? 0)
      commission += Number(t.commission ?? 0)
    })
    return { amount, commission }
  }, [transactions])

  const pageCount = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = transactions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const resetFilters = () => {
    setSearch('')
    setStatus('الكل')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const changeStatus = async (t, next) => {
    if (next === t.status) return
    setStatusBusy(t.id)
    try {
      await api.updateTransactionStatus(t.id, next)
      setTransactions((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)))
      setNotice({ text: `تم تحديث حالة المعاملة ${t.reference} إلى ${next} ✓`, tone: 'success' })
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setStatusBusy(null)
    }
  }

  const onSaved = () => {
    setModal(null)
    setNotice({ text: modal === 'new' ? 'تمت إضافة المعاملة بنجاح ✓' : 'تم حفظ التعديلات بنجاح ✓', tone: 'success' })
    setRefresh((r) => r + 1)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteTransaction(deleteTarget.id)
      setTransactions((prev) => prev.filter((x) => x.id !== deleteTarget.id))
      setNotice({ text: `تم حذف المعاملة ${deleteTarget.reference} بنجاح`, tone: 'success' })
      setDeleteTarget(null)
    } catch (e) {
      setNotice({ text: e.message, tone: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const exportCsv = () => {
    const header = ['المعاملة', 'العميل', 'الخدمة', 'طريقة الدفع', 'التاريخ', 'المبلغ (ر.س)', 'العمولة', 'الحالة']
    const lines = transactions.map((t) =>
      [t.reference, t.client, t.service, t.method, t.date, t.amount, t.commission, t.status].join(','),
    )
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${localDateStr(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setNotice({ text: 'تم تصدير الملف بنجاح ✓', tone: 'success' })
  }

  if (error && transactions.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-red-50 text-red-500">
          <Icon name="x" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">تعذر تحميل المعاملات</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{error}</p>
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري تحميل المعاملات...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">المعاملات</h2>
          <p className="mt-1 text-sm text-ink-soft">سجل مدفوعات العملاء وعمولات المنصة على كل خدمة</p>
        </div>
        <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setModal('new')}>
          إضافة معاملة
        </Button>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold animate-slide-in ${
            notice.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-accent-soft/30 bg-mint text-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon name={notice.tone === 'error' ? 'x' : 'check'} size={16} strokeWidth={2.4} />
            {notice.text}
          </span>
          <button
            onClick={() => setNotice(null)}
            aria-label="إغلاق"
            className="grid size-6 place-items-center rounded-md transition-colors hover:bg-accent/30"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={`rounded-2xl border px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 ${
              status === s
                ? 'border-primary bg-primary text-white shadow-[0_6px_16px_rgba(7,94,102,0.35)]'
                : 'border-line bg-card shadow-card hover:shadow-pop'
            }`}
          >
            <p className={`text-2xl font-extrabold ${status === s ? 'text-white' : 'text-ink'}`}>{num(counts[s])}</p>
            <p className={`text-xs font-semibold ${status === s ? 'text-white/70' : 'text-ink-mute'}`}>
              {s === 'الكل' ? 'إجمالي المعاملات' : s}
            </p>
          </button>
        ))}
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
            <Icon name="wallet" size={20} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-mute">إجمالي المبالغ</p>
            <p className="text-lg font-extrabold text-ink">{num(Math.round(totals.amount))} ر.س</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
            <Icon name="banknote" size={20} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-mute">العمولات المحصلة</p>
            <p className="text-lg font-extrabold text-ink">{num(Math.round(totals.commission))} ر.س</p>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              icon="search"
              placeholder="ابحث بالمرجع أو العميل أو الخدمة..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select className="w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Input className="w-40" type="date" aria-label="من تاريخ" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
          <Input className="w-40" type="date" aria-label="إلى تاريخ" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
          <Button variant="ghost" icon={<Icon name="download" size={17} />} onClick={exportCsv}>
            تصدير CSV
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
              <Icon name="banknote" size={38} strokeWidth={1.6} />
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد معاملات مطابقة</h3>
            <p className="mt-1.5 max-w-sm text-sm text-ink-soft">جرّب تعديل البحث أو الفلاتر، أو أضف معاملة جديدة.</p>
            <Button variant="outline" className="mt-5" onClick={resetFilters}>
              إعادة تعيين الفلاتر
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                  <th className="px-5 py-3 text-start">المعاملة</th>
                  <th className="px-4 py-3 text-start">العميل</th>
                  <th className="px-4 py-3 text-start">الخدمة</th>
                  <th className="px-4 py-3 text-start">طريقة الدفع</th>
                  <th className="px-4 py-3 text-start">التاريخ</th>
                  <th className="px-4 py-3 text-start">المبلغ</th>
                  <th className="px-4 py-3 text-start">العمولة</th>
                  <th className="px-4 py-3 text-start">الحالة</th>
                  <th className="px-5 py-3 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-mint/40">
                    <td className="px-5 py-3.5 font-extrabold text-primary">{t.reference}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={t.client} size={32} />
                        <span className="font-bold text-ink">{t.client ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-ink-soft">{t.service}</td>
                    <td className="px-4 py-3.5 text-ink-soft">{t.method}</td>
                    <td className="px-4 py-3.5 text-ink-soft">{fmtDate(t.date)}</td>
                    <td className="px-4 py-3.5 font-extrabold text-ink">{num(t.amount)} ر.س</td>
                    <td className="px-4 py-3.5 text-ink-soft">{num(t.commission)} ر.س</td>
                    <td className="px-4 py-3.5">
                      <Select
                        className="w-36"
                        value={t.status}
                        disabled={statusBusy === t.id}
                        onChange={(e) => changeStatus(t, e.target.value)}
                      >
                        {statusChoices(meta, 'transactionStatus', t.status).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="تعديل"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                          onClick={() => setModal(t)}
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          title="حذف"
                          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                          onClick={() => setDeleteTarget(t)}
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transactions.length > 0 && (
          <Pagination page={safePage} pageSize={PAGE_SIZE} total={transactions.length} onChange={setPage} />
        )}
      </Card>

      {/* Add / edit modal */}
      {modal && (
        <TransactionModal
          key={modal === 'new' ? 'new' : `edit-${modal.id}`}
          editing={modal === 'new' ? null : modal}
          clients={clients}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف المعاملة"
        subtitle="لا يمكن التراجع عن هذا الإجراء"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              إلغاء
            </Button>
            <Button variant="danger" icon={<Icon name="trash" size={16} />} onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'جارٍ الحذف...' : 'حذف نهائي'}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
            <Icon name="trash" size={20} />
          </span>
          <p className="text-sm leading-relaxed text-ink-soft">
            هل أنت متأكد من حذف المعاملة <span className="font-extrabold text-ink">«{deleteTarget?.reference}»</span>؟
            سيتم حذفها نهائياً من سجل المعاملات.
          </p>
        </div>
      </Modal>
    </div>
  )
}

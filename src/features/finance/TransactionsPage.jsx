import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import PageState from '@/components/ui/PageState'
import Icon from '@/components/ui/Icon'
import Notice from '@/components/ui/Notice'
import PageHeader from '@/components/ui/PageHeader'
import StatStrip from '@/components/ui/StatStrip'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'
import { api } from '@/app/api'
import { allFilter, options, useMeta } from '@/app/meta'
import { localDateStr, num } from '@/utils/format'
import TransactionModal from '@/features/finance/components/TransactionModal'
import TransactionsToolbar from '@/features/finance/components/TransactionsToolbar'
import TransactionsTable from '@/features/finance/components/TransactionsTable'

const PAGE_SIZE = 8

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
      <PageState
        mode="error"
        title="تعذر تحميل المعاملات"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (loading && transactions.length === 0) {
    return (
      <PageState
        mode="loading"
        label="جاري تحميل المعاملات..."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="المعاملات"
        subtitle="سجل مدفوعات العملاء وعمولات المنصة على كل خدمة"
        actions={
          <Button icon={<Icon name="plus" size={18} strokeWidth={2.4} />} onClick={() => setModal('new')}>
            إضافة معاملة
          </Button>
        }
      />

      {/* Notice */}
      {notice && <Notice text={notice.text} tone={notice.tone} onDismiss={() => setNotice(null)} />}

      {/* Stat strip */}
      <StatStrip
        active={status}
        onSelect={(k) => {
          setStatus(k)
          setPage(1)
        }}
        items={statuses.map((s) => ({
          key: s,
          value: num(counts[s]),
          label: s === 'الكل' ? 'إجمالي المعاملات' : s,
        }))}
      />

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

      <TransactionsToolbar
        search={search}
        onSearchChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        status={status}
        onStatusChange={(e) => {
          setStatus(e.target.value)
          setPage(1)
        }}
        statuses={statuses}
        from={from}
        onFromChange={(e) => {
          setFrom(e.target.value)
          setPage(1)
        }}
        to={to}
        onToChange={(e) => {
          setTo(e.target.value)
          setPage(1)
        }}
        onExport={exportCsv}
      />

      <TransactionsTable
        rows={paged}
        page={safePage}
        pageSize={PAGE_SIZE}
        total={transactions.length}
        onPageChange={setPage}
        onEdit={setModal}
        onDelete={setDeleteTarget}
        statusBusy={statusBusy}
        onStatusChange={changeStatus}
        onResetFilters={resetFilters}
      />

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
      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="حذف المعاملة"
        confirmLabel="حذف نهائي"
        busy={deleting}
        message={
          <>
            هل أنت متأكد من حذف المعاملة <span className="font-extrabold text-ink">«{deleteTarget?.reference}»</span>؟
            سيتم حذفها نهائياً من سجل المعاملات.
          </>
        }
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

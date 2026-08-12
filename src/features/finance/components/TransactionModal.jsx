import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Input, Select } from '@/components/ui/Input'
import { api } from '@/app/api'
import { options, useMeta } from '@/app/meta'
import { localDateStr } from '@/utils/format'

export default function TransactionModal({ editing, clients, onClose, onSaved }) {
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
        {error && <FormError rounded="xl">{error}</FormError>}

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

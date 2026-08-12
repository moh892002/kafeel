import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { api } from '@/app/api'
import { feeFor, options, sessionTypes, useMeta } from '@/app/meta'
import { localDateStr, num } from '@/utils/format'

export default function BookingModal({ specialists, clients, onClose, onSaved }) {
  const meta = useMeta()
  const [form, setForm] = useState({
    specialistId: specialists[0]?.id ?? '',
    clientId: clients[0]?.id ?? '',
    type: sessionTypes(meta)[0]?.name ?? '',
    date: '',
    time: '16:00',
    payment: options(meta, 'paymentMethod')[0] ?? '',
    note: '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const todayStr = localDateStr(new Date())

  const specialist = specialists.find((x) => x.id === Number(form.specialistId)) ?? specialists[0]
  const client = clients.find((x) => x.id === Number(form.clientId)) ?? clients[0]
  const fee = specialist ? feeFor(Number(specialist.fee), form.type) : 0

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.date || !form.time) {
      setError('يرجى اختيار تاريخ ووقت الجلسة')
      return
    }
    if (form.date < todayStr) {
      setError('لا يمكن حجز جلسة في تاريخ سابق')
      return
    }
    if (!form.specialistId || !form.clientId) {
      setError('يرجى اختيار الأخصائي والعميل')
      return
    }
    setSubmitting(true)
    try {
      const created = await api.createSession({
        clientName: client.name,
        clientId: client.id,
        specialistId: Number(form.specialistId),
        type: form.type,
        date: form.date,
        time: form.time,
        payment: form.payment,
        note: form.note.trim() || null,
      })
      onSaved(created)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="حجز جلسة جديدة"
      subtitle="حدد بيانات الجلسة وسيتم إضافتها للجدول والتقويم"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="calendar" size={16} />} onClick={save} disabled={submitting}>
            {submitting ? 'جارٍ الحجز...' : 'تأكيد الحجز'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <FormError rounded="xl">{error}</FormError>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="الأخصائي" id="booking-specialist" icon="user-check" value={form.specialistId} onChange={set('specialistId')}>
            {specialists.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title} {x.name} — {x.specialty}
              </option>
            ))}
          </Select>
          <Select label="العميل" id="booking-client" icon="users" value={form.clientId} onChange={set('clientId')}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="نوع الجلسة" id="booking-type" icon="video" value={form.type} onChange={set('type')}>
            {sessionTypes(meta).map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </Select>
          <Select label="وسيلة الدفع" id="booking-payment" icon="banknote" value={form.payment} onChange={set('payment')}>
            {options(meta, 'paymentMethod').map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input label="التاريخ" id="booking-date" type="date" min={todayStr} value={form.date} onChange={set('date')} />
          <Input label="الوقت" id="booking-time" type="time" value={form.time} onChange={set('time')} />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-mint px-4 py-3">
          <span className="text-sm font-semibold text-ink-soft">الرسوم المتوقعة</span>
          <span className="text-lg font-extrabold text-primary">{num(fee)} ر.س</span>
        </div>

        <Textarea
          label="ملاحظات (اختياري)"
          id="booking-note"
          rows={3}
          placeholder="مثال: جلسة تقييم أولية للحالة..."
          value={form.note}
          onChange={set('note')}
        />
      </div>
    </Modal>
  )
}

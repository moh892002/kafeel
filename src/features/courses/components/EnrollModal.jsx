import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Input, Select } from '@/components/ui/Input'
import { api } from '@/app/api'
import { options, useMeta } from '@/app/meta'

export default function EnrollModal({ course, onClose, onSaved }) {
  const meta = useMeta()
  const methods = options(meta, 'paymentMethod')
  const [form, setForm] = useState({ clientName: '', method: methods[0] ?? 'مدى', date: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // capacity 0 means unlimited seats — never show a (misleading) seat count then.
  const unlimited = Number(course.capacity) <= 0
  const seats = unlimited ? null : Math.max(0, course.capacity - course.enrolled)

  const save = async () => {
    if (!form.clientName.trim()) {
      setError('يرجى إدخال اسم العميل')
      return
    }
    if (!unlimited && seats === 0) {
      setError('الدورة ممتلئة، تعذر تسجيل مشارك إضافي')
      return
    }
    setSubmitting(true)
    try {
      await api.enrollCourse(course.id, {
        clientName: form.clientName.trim(),
        method: form.method,
        date: form.date || null,
      })
      onSaved()
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="تسجيل عميل في الدورة"
      subtitle={`«${course.title}» — ${unlimited ? 'مقاعد غير محدودة' : `${seats} مقعد متبقي`}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            onClick={save}
            disabled={submitting}
            icon={submitting ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="check" size={16} />}
          >
            {submitting ? 'جارٍ التسجيل...' : 'تأكيد التسجيل'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <FormError rounded="xl">{error}</FormError>}
        <Input
          id="en-name"
          label="اسم العميل *"
          placeholder="مثال: أحمد الشمري"
          value={form.clientName}
          onChange={(e) => {
            setForm((f) => ({ ...f, clientName: e.target.value }))
            setError(null)
          }}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select id="en-method" label="وسيلة الدفع" icon="wallet" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input id="en-date" label="تاريخ التسجيل" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </div>
      </div>
    </Modal>
  )
}

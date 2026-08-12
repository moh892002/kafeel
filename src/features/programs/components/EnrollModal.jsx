import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Input, Select } from '@/components/ui/Input'
import { api } from '@/app/api'
import { options, useMeta } from '@/app/meta'

export default function EnrollModal({ program, onClose, onEnrolled }) {
  const meta = useMeta()
  const methods = options(meta, 'paymentMethod')
  const [form, setForm] = useState({ clientName: '', method: methods[0] ?? 'مدى' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const save = async () => {
    if (!form.clientName.trim()) {
      setError('يرجى إدخال اسم العميل')
      return
    }
    setSubmitting(true)
    try {
      await api.enrollProgram(program.id, {
        clientName: form.clientName.trim(),
        method: form.method,
      })
      onEnrolled(form.clientName.trim())
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  // capacity 0 means unlimited seats — never show a (misleading) seat count then.
  const unlimited = Number(program.capacity) <= 0
  const seats = unlimited ? null : Math.max(0, program.capacity - program.enrolled)

  return (
    <Modal
      open
      onClose={onClose}
      title="تسجيل في البرنامج"
      subtitle={`«${program.title}» — ${unlimited ? 'مقاعد غير محدودة' : `${seats} مقعد متبقي`}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="check" size={16} />} onClick={save} disabled={submitting}>
            {submitting ? 'جارٍ التسجيل...' : 'تأكيد التسجيل'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <FormError rounded="xl">{error}</FormError>}
        <Input
          label="اسم العميل"
          id="pe-name"
          placeholder="مثال: أحمد الشمري"
          value={form.clientName}
          onChange={(e) => {
            setForm((f) => ({ ...f, clientName: e.target.value }))
            setError(null)
          }}
        />
        <Select
          label="وسيلة الدفع"
          id="pe-method"
          icon="wallet"
          value={form.method}
          onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
        >
          {methods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>
    </Modal>
  )
}

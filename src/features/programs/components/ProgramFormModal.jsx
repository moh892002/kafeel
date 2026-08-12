import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { api } from '@/app/api'
import { localDateStr } from '@/utils/format'
import { PROGRAM_CATEGORIES } from '../constants'

export default function ProgramFormModal({ specialists, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '',
    category: PROGRAM_CATEGORIES[0],
    instructorId: specialists[0]?.id ?? '',
    price: 300,
    capacity: 60,
    sessions: 8,
    startDate: localDateStr(),
    description: '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.title.trim()) {
      setError('يرجى إدخال اسم البرنامج')
      return
    }
    if (!form.instructorId) {
      setError('يرجى اختيار مقدم البرنامج')
      return
    }
    setSubmitting(true)
    try {
      const created = await api.createProgram({
        title: form.title.trim(),
        category: form.category,
        instructorId: Number(form.instructorId),
        description: form.description.trim() || null,
        sessions: Number(form.sessions) || 8,
        price: Number(form.price) || 0,
        capacity: Number(form.capacity) || 60,
        startDate: form.startDate,
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
      title="إضافة برنامج جديد"
      subtitle="أنشئ برنامجاً تدريبياً جديداً على المنصة"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="plus" size={16} strokeWidth={2.4} />} onClick={save} disabled={submitting}>
            {submitting ? 'جارٍ الإنشاء...' : 'إنشاء البرنامج'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <FormError rounded="xl">{error}</FormError>}
        <Input label="اسم البرنامج" id="pg-title" placeholder="مثال: برنامج إدارة الضغوط" value={form.title} onChange={set('title')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="الفئة" id="pg-category" value={form.category} onChange={set('category')}>
            {PROGRAM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select label="مقدم البرنامج" id="pg-instructor" icon="user-check" value={form.instructorId} onChange={set('instructorId')}>
            {specialists.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input label="السعر (ر.س)" id="pg-price" type="number" min="0" value={form.price} onChange={set('price')} />
          <Input label="الطاقة" id="pg-capacity" type="number" min="1" value={form.capacity} onChange={set('capacity')} />
          <Input label="الجلسات" id="pg-sessions" type="number" min="1" value={form.sessions} onChange={set('sessions')} />
          <Input label="تاريخ البدء" id="pg-start" type="date" value={form.startDate} onChange={set('startDate')} />
        </div>
        <Textarea label="وصف البرنامج" id="pg-desc" rows={3} value={form.description} onChange={set('description')} placeholder="نبذة عن البرنامج وأهدافه..." />
      </div>
    </Modal>
  )
}

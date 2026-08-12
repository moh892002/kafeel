import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Input } from '@/components/ui/Input'
import { api } from '@/app/api'

export default function LessonFormModal({ lesson, courseId, onClose, onSaved }) {
  const editing = Boolean(lesson)
  const [form, setForm] = useState({
    title: lesson?.title ?? '',
    minutes: lesson?.minutes ?? 30,
    preview: lesson?.preview ?? false,
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.title.trim()) {
      setError('يرجى إدخال عنوان الدرس')
      return
    }
    setSubmitting(true)
    try {
      const payload = { title: form.title.trim(), minutes: Number(form.minutes) || 0, preview: form.preview }
      if (editing) {
        await api.updateLesson(courseId, lesson.id, payload)
      } else {
        await api.addLesson(courseId, payload)
      }
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
      title={editing ? 'تعديل الدرس' : 'إضافة درس'}
      subtitle={editing ? 'قم بتحديث بيانات هذا الدرس' : 'أضف درساً جديداً إلى محتويات الدورة'}
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
            {submitting ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الدرس'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <FormError rounded="xl">{error}</FormError>}
        <Input id="ls-title" label="عنوان الدرس *" value={form.title} onChange={set('title')} placeholder="مثال: مقدمة في العلاج المعرفي السلوكي" />
        <div className="grid grid-cols-2 gap-4">
          <Input id="ls-minutes" label="المدة (بالدقائق)" type="number" min="0" value={form.minutes} onChange={set('minutes')} />
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
              <input type="checkbox" checked={form.preview} onChange={set('preview')} className="size-4 accent-primary" />
              درس معاينة مجانية
            </label>
          </div>
        </div>
      </div>
    </Modal>
  )
}

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Select, Textarea } from '@/components/ui/Input'
import { FAQ_CATEGORIES } from '../constants'

export default function FaqFormModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial ?? { category: FAQ_CATEGORIES[0], question: '', answer: '', pinned: false },
  )
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.question.trim()) {
      setError('يرجى كتابة السؤال')
      return
    }
    if (!form.answer.trim()) {
      setError('يرجى كتابة الإجابة')
      return
    }
    setSubmitting(true)
    try {
      await onSave({ ...form, question: form.question.trim(), answer: form.answer.trim() })
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
      subtitle="الأسئلة الأكثر تداولاً من قبل العملاء"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="check" size={16} />} onClick={save} disabled={submitting}>
            {submitting ? 'جارٍ الحفظ...' : initial ? 'حفظ التعديلات' : 'إضافة السؤال'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <FormError rounded="xl">{error}</FormError>}
        <Select label="الفئة" id="faq-category" value={form.category} onChange={set('category')}>
          {FAQ_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Textarea label="السؤال" id="faq-question" rows={2} value={form.question} onChange={set('question')} placeholder="اكتب السؤال هنا..." />
        <Textarea label="الإجابة" id="faq-answer" rows={4} value={form.answer} onChange={set('answer')} placeholder="اكتب الإجابة الوافية..." />
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
            className="size-4 accent-primary"
          />
          تثبيت السؤال في أعلى القائمة
        </label>
      </div>
    </Modal>
  )
}

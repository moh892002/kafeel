import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { api } from '@/app/api'
import { EXPERIENCE_OPTIONS, QUALIFICATION_OPTIONS, TITLE_OPTIONS } from '../constants'

export default function EditSpecialistModal({ specialist, specialtyOptions, onSaved, onClose }) {
  const [form, setForm] = useState({
    title: specialist.title ?? 'د.',
    name: specialist.name ?? '',
    specialty: specialist.specialty ?? '',
    email: specialist.email ?? '',
    phone: specialist.phone ?? '',
    yearsExperience: specialist.yearsExperience ?? '',
    qualification: specialist.qualification ?? '',
    fee: specialist.fee ?? 0,
    bio: specialist.bio ?? '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Never drop the current specialty out of the dropdown, even if it's not in the derived list.
  const specialtyOpts = useMemo(() => {
    if (specialtyOptions.includes(form.specialty)) return specialtyOptions
    return [form.specialty, ...specialtyOptions].filter(Boolean)
  }, [specialtyOptions, form.specialty])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.name.trim()) {
      setError('يرجى إدخال الاسم')
      return
    }
    if (!form.specialty) {
      setError('يرجى اختيار التخصص')
      return
    }
    setSubmitting(true)
    try {
      const updated = await api.updateSpecialist(specialist.id, {
        title: form.title,
        name: form.name.trim(),
        specialty: form.specialty,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        bio: form.bio.trim() || null,
        yearsExperience: form.yearsExperience || null,
        qualification: form.qualification || null,
        fee: Number(form.fee) || 0,
      })
      onSaved(updated)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="تعديل بيانات الأخصائي"
      subtitle={`${specialist.title} ${specialist.name}`}
      size="lg"
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
            {submitting ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <FormError rounded="xl">{error}</FormError>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select id="ed-title" label="اللقب" value={form.title} onChange={set('title')}>
            {TITLE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t === 'د.' ? 'دكتور (د.)' : 'أستاذ (أ.)'}
              </option>
            ))}
          </Select>
          <Input id="ed-name" label="الاسم الكامل *" value={form.name} onChange={set('name')} placeholder="مثال: د. خالد السالم" />
          <Select id="ed-specialty" label="التخصص الرئيسي *" value={form.specialty} onChange={set('specialty')}>
            {specialtyOpts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            id="ed-years"
            label="سنوات الخبرة"
            value={form.yearsExperience}
            onChange={set('yearsExperience')}
          >
            <option value="">غير محدد</option>
            {EXPERIENCE_OPTIONS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
          <Input id="ed-email" label="البريد الإلكتروني" type="email" value={form.email} onChange={set('email')} />
          <Input id="ed-phone" label="رقم الجوال" type="tel" value={form.phone} onChange={set('phone')} placeholder="05xxxxxxxx" />
          <Select id="ed-qualification" label="المؤهل العلمي" value={form.qualification} onChange={set('qualification')}>
            <option value="">غير محدد</option>
            {QUALIFICATION_OPTIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </Select>
          <Input id="ed-fee" label="رسوم الجلسة (ر.س)" type="number" min="0" value={form.fee} onChange={set('fee')} />
        </div>
        <Textarea id="ed-bio" label="نبذة تعريفية" rows={3} value={form.bio} onChange={set('bio')} placeholder="نبذة قصيرة عن الأخصائي وخبراته..." />
      </div>
    </Modal>
  )
}

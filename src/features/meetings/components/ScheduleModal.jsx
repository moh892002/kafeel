import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Input, Select } from '@/components/ui/Input'
import { api } from '@/app/api'
import { options, useMeta } from '@/app/meta'

export default function ScheduleModal({ specialists, onClose, onSaved }) {
  const meta = useMeta()
  const [form, setForm] = useState({
    title: '',
    type: options(meta, 'meetingType')[0] ?? '',
    hostId: specialists[0]?.id ?? '',
    date: '',
    time: '19:00',
    duration: 60,
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.title.trim()) {
      setError('يرجى إدخال عنوان اللقاء')
      return
    }
    if (!form.date) {
      setError('يرجى اختيار تاريخ اللقاء')
      return
    }
    if (!form.hostId) {
      setError('يرجى اختيار مقدم اللقاء')
      return
    }
    setSubmitting(true)
    try {
      const created = await api.createMeeting({
        title: form.title.trim(),
        type: form.type,
        hostId: Number(form.hostId),
        date: form.date,
        time: form.time,
        duration: Number(form.duration),
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
      title="جدولة لقاء جديد"
      subtitle="أنشئ لقاءً جماعياً أو ورشة عمل أو بثاً مباشراً"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          <Button icon={<Icon name="calendar" size={16} />} onClick={save} disabled={submitting}>
            {submitting ? 'جارٍ الجدولة...' : 'جدولة اللقاء'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <FormError rounded="xl">{error}</FormError>}
        <Input label="عنوان اللقاء" id="mt-title" placeholder="مثال: ورشة إدارة الضغوط" value={form.title} onChange={set('title')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="نوع اللقاء" id="mt-type" icon="video" value={form.type} onChange={set('type')}>
            {options(meta, 'meetingType').map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select label="مقدم اللقاء" id="mt-host" icon="user-check" value={form.hostId} onChange={set('hostId')}>
            {specialists.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} {s.name}
              </option>
            ))}
          </Select>
          <Input label="التاريخ" id="mt-date" type="date" value={form.date} onChange={set('date')} />
          <Input label="الوقت" id="mt-time" type="time" value={form.time} onChange={set('time')} />
        </div>
        <Select label="المدة (بالدقائق)" id="mt-duration" value={form.duration} onChange={set('duration')}>
          {[45, 60, 90, 120].map((d) => (
            <option key={d} value={d}>
              {d} دقيقة
            </option>
          ))}
        </Select>
      </div>
    </Modal>
  )
}

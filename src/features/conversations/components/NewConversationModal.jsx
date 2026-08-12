import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Icon from '@/components/ui/Icon'
import FormError from '@/components/ui/FormError'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { api } from '@/app/api'

export default function NewConversationModal({ onClose, onCreated }) {
  const [clients, setClients] = useState([])
  const [specialists, setSpecialists] = useState([])
  const [ready, setReady] = useState(false)
  const [form, setForm] = useState({ clientName: '', specialistId: '', message: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([api.clients(), api.specialists()]).then((results) => {
      if (cancelled) return
      // allSettled keeps whichever reference list loaded — a failed fetch must not hide the other.
      if (results[0].status === 'fulfilled') setClients(results[0].value ?? [])
      if (results[1].status === 'fulfilled') setSpecialists(results[1].value ?? [])
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setError(null)
  }

  const save = async () => {
    if (!form.clientName.trim()) {
      setError('يرجى إدخال اسم العميل')
      return
    }
    setSubmitting(true)
    try {
      const created = await api.createConversation({
        clientName: form.clientName.trim(),
        specialistId: form.specialistId ? Number(form.specialistId) : null,
        message: form.message.trim() || null,
      })
      onCreated(created)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="محادثة جديدة"
      subtitle="ابدأ محادثة مع عميل وإحالتها إلى أخصائي إن لزم"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            onClick={save}
            disabled={submitting}
            icon={submitting ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="chat" size={16} />}
          >
            {submitting ? 'جارٍ الإنشاء...' : 'إنشاء المحادثة'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <FormError rounded="xl">{error}</FormError>}

        <div>
          <Input
            id="nc-client"
            label="اسم العميل *"
            list="nc-client-names"
            placeholder="اختر من القائمة أو اكتب الاسم..."
            value={form.clientName}
            onChange={set('clientName')}
            icon="user"
          />
          <datalist id="nc-client-names">
            {clients.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          <p className="mt-1.5 text-[11px] text-ink-mute">
            {!ready
              ? 'جارٍ تحميل قائمة العملاء...'
              : clients.length > 0
                ? `يمكنك الاختيار من ${clients.length} عميل مسجل أو كتابة اسم جديد`
                : 'يمكنك كتابة اسم العميل مباشرة'}
          </p>
        </div>

        <Select id="nc-specialist" label="إحالة إلى أخصائي (اختياري)" icon="user-check" value={form.specialistId} onChange={set('specialistId')}>
          <option value="">بدون إحالة</option>
          {specialists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} {s.name} — {s.specialty}
            </option>
          ))}
        </Select>

        <Textarea
          id="nc-message"
          label="موضوع المحادثة (اختياري)"
          rows={3}
          maxLength={2000}
          placeholder="مثال: استفسار عن مواعيد الجلسات المتاحة..."
          value={form.message}
          onChange={set('message')}
        />
      </div>
    </Modal>
  )
}

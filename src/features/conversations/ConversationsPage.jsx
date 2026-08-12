import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { api } from '../api'

const fmtTime = (t) => {
  const d = new Date(t)
  return new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' }).format(d)
}

const timeAgo = (iso) => {
  if (!iso) return '' // a fresh conversation has no first message yet
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'الآن'
  if (min < 60) return `قبل ${min} د`
  const h = Math.floor(min / 60)
  if (h < 24) return `قبل ${h} س`
  const d = Math.floor(h / 24)
  return `قبل ${d} يوم`
}

/* ---------- New conversation modal ---------- */
function NewConversationModal({ onClose, onCreated }) {
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
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-slide-in">
            <Icon name="x" size={16} strokeWidth={2.4} />
            {error}
          </div>
        )}

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

export default function Conversations() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [active, setActive] = useState(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [chatReload, setChatReload] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('الكل') // 'الكل' | 'غير مقروء'
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState(null)
  const [newOpen, setNewOpen] = useState(false)
  const [notice, setNotice] = useState(null) // { text, tone: 'success' | 'error' }
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!notice) return undefined
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const list = await api.conversations()
        if (cancelled) return
        setConversations(list ?? [])
        setLoading(false)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Open the first conversation once the list has loaded.
  useEffect(() => {
    if (conversations.length > 0 && activeId === null) {
      setActiveId(conversations[0].id)
    }
  }, [conversations, activeId])

  // Fetch the full thread (messages) whenever the active conversation changes.
  useEffect(() => {
    if (!activeId) {
      setActive(null)
      return undefined
    }
    let cancelled = false
    setActive(null) // clear the previous thread so the pane doesn't show stale data
    setChatLoading(true)
    setChatError(null)
    api.conversation(activeId)
      .then((d) => {
        if (cancelled) return
        setActive(d)
        setChatLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setChatError(e.message)
        setChatLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeId, chatReload])

  // Keep the latest message in view when opening a chat or sending
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [activeId, active?.messages?.length])

  // On mobile the chat pane sits below the list — reveal it on selection
  useEffect(() => {
    if (window.innerWidth < 1024) {
      document.getElementById('chat-pane')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return conversations.filter((c) => {
      if (filter === 'غير مقروء' && !c.unread) return false
      if (q && !`${c.client} ${c.specialist?.name ?? ''} ${c.lastMessage}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [conversations, search, filter])

  const open = (id) => {
    const conv = conversations.find((c) => c.id === id)
    setActiveId(id)
    setDraft('')
    setSendError(null)
    if (conv?.unread) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: false } : c)))
      api.markConversationRead(id).catch(() => {
        /* keep the local optimistic update */
      })
    }
  }

  const send = async () => {
    const text = draft.trim()
    if (!text || !activeId || chatLoading) return
    setSendError(null)
    try {
      const msg = await api.sendMessage(activeId, text)
      setActive((prev) => (prev ? { ...prev, messages: [...prev.messages, msg], lastMessage: text, lastTime: msg.time } : prev))
      setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, lastMessage: text, lastTime: msg.time } : c)))
      setDraft('')
    } catch (e) {
      setSendError(e.message)
    }
  }

  const unreadCount = conversations.filter((c) => c.unread).length

  if (error) {
    return (
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-red-50 text-red-500">
          <Icon name="x" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">تعذر تحميل المحادثات</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{error}</p>
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <div className="flex items-center gap-3 text-sm font-bold">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري تحميل المحادثات...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">إدارة المحادثات</h2>
          <p className="mt-1 text-sm text-ink-soft">متابعة محادثات العملاء مع الأخصائيين والرد على الاستفسارات</p>
        </div>
        <Button icon={<Icon name="chat" size={18} strokeWidth={2.4} />} onClick={() => setNewOpen(true)}>
          محادثة جديدة
        </Button>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold animate-slide-in ${
            notice.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-accent-soft/30 bg-mint text-primary'
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon name={notice.tone === 'error' ? 'x' : 'check'} size={16} strokeWidth={2.4} />
            {notice.text}
          </span>
          <button onClick={() => setNotice(null)} aria-label="إغلاق" className="grid size-6 place-items-center rounded-md transition-colors hover:bg-accent/30">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        {/* Conversation list */}
        <Card className="flex flex-col overflow-hidden">
          <div className="border-b border-line p-3.5">
            <Input
              icon="search"
              placeholder="ابحث في المحادثات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mt-3 flex items-center gap-2">
              {['الكل', 'غير مقروء'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                    filter === f ? 'bg-primary text-white' : 'bg-surface text-ink-soft hover:bg-mint hover:text-primary'
                  }`}
                >
                  {f}
                  {f === 'غير مقروء' && unreadCount > 0 && (
                    <span className="grid size-4.5 place-items-center rounded-full bg-amber-400 text-[10px] font-extrabold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <ul className="min-h-[420px] flex-1 divide-y divide-line overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="flex flex-col items-center px-6 py-16 text-center">
                <Icon name="chat" size={32} className="text-ink-mute" />
                <p className="mt-3 text-sm font-bold text-ink-soft">لا توجد محادثات مطابقة</p>
              </li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => open(c.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-mint/40 ${
                      activeId === c.id ? 'bg-mint/60' : ''
                    }`}
                  >
                    <span className="relative shrink-0">
                      <Avatar name={c.client} size={44} />
                      {c.online && (
                        <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-extrabold text-ink">{c.client}</span>
                        <span className="shrink-0 text-[10px] font-semibold text-ink-mute">{timeAgo(c.lastTime)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={`truncate text-xs ${c.unread ? 'font-bold text-ink' : 'text-ink-mute'}`}>
                          {c.lastMessage}
                        </span>
                        {c.unread && <span className="size-2.5 shrink-0 rounded-full bg-amber-400" />}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </Card>

        {/* Chat pane */}
        <Card id="chat-pane" className="flex min-h-[560px] flex-col overflow-hidden">
          {active ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={active.client} size={42} />
                  <div>
                    <p className="text-sm font-extrabold text-ink">{active.client}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-mute">
                      <span className={`size-2 rounded-full ${active.online ? 'bg-emerald-500' : 'bg-line'}`} />
                      {active.online ? 'متصل الآن' : 'آخر ظهور قبل قليل'}
                      <span className="text-ink-mute/70">· {active.specialist?.title ?? ''} {active.specialist?.name ?? ''}</span>
                    </p>
                  </div>
                </div>
                <Badge tone="soft">{(active.messages ?? []).length} رسالة</Badge>
              </div>

              {chatLoading ? (
                <div className="flex flex-1 items-center justify-center text-primary">
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <Icon name="loader" size={18} className="animate-spin" />
                    جاري تحميل الرسائل...
                  </div>
                </div>
              ) : chatError ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <Icon name="x" size={28} className="text-red-400" />
                  <p className="text-sm font-bold text-ink-soft">{chatError}</p>
                  <Button variant="outline" size="sm" onClick={() => setChatReload((v) => v + 1)}>
                    إعادة المحاولة
                  </Button>
                </div>
              ) : (
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-surface/50 px-5 py-4">
                  {(active.messages ?? []).length === 0 ? (
                    <p className="py-10 text-center text-sm font-semibold text-ink-mute">
                      لا توجد رسائل بعد — ابدأ المحادثة.
                    </p>
                  ) : (
                    active.messages.map((m) => {
                      const mine = m.from === 'admin'
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card ${
                              mine
                                ? 'rounded-br-md bg-primary text-white'
                                : 'rounded-bl-md border border-line bg-white text-ink'
                            }`}
                          >
                            <p>{m.text}</p>
                            <p className={`mt-1 text-[10px] font-semibold ${mine ? 'text-white/60' : 'text-ink-mute'}`}>
                              {fmtTime(m.time)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              <div className="border-t border-line p-3.5">
                {sendError && (
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-red-500">
                    <Icon name="x" size={13} />
                    {sendError}
                  </p>
                )}
                <div className="flex items-center gap-2.5">
                  <Input
                    placeholder="اكتب رسالتك..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') send()
                    }}
                  />
                  <Button icon={<Icon name="send" size={17} />} onClick={send} disabled={!draft.trim() || chatLoading}>
                    إرسال
                  </Button>
                </div>
              </div>
            </>
          ) : chatLoading ? (
            <div className="flex flex-1 items-center justify-center text-primary">
              <div className="flex items-center gap-3 text-sm font-bold">
                <Icon name="loader" size={18} className="animate-spin" />
                جاري تحميل الرسائل...
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
              <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
                <Icon name="chat" size={38} strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-ink">اختر محادثة للبدء</h3>
              <p className="mt-1.5 max-w-sm text-sm text-ink-soft">اختر محادثة من القائمة لعرض الرسائل والرد عليها.</p>
            </div>
          )}
        </Card>
      </div>

      {/* New conversation modal */}
      {newOpen && (
        <NewConversationModal
          onClose={() => setNewOpen(false)}
          onCreated={(created) => {
            setNewOpen(false)
            setConversations((prev) => [created, ...prev])
            setActiveId(created.id)
            setSearch('')
            setFilter('الكل')
            setDraft('') // don't carry an unsent draft from the previous thread
            setSendError(null)
            setNotice({ text: `تم إنشاء محادثة مع «${created.client}» بنجاح ✓`, tone: 'success' })
          }}
        />
      )}
    </div>
  )
}

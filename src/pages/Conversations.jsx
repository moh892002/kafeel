import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Icon from '../components/ui/Icon'
import { Input } from '../components/ui/Input'
import { buildConversations } from '../data/conversations'

const fmtTime = (t) => {
  const d = new Date(t)
  return new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' }).format(d)
}

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'الآن'
  if (min < 60) return `قبل ${min} د`
  const h = Math.floor(min / 60)
  if (h < 24) return `قبل ${h} س`
  const d = Math.floor(h / 24)
  return `قبل ${d} يوم`
}

export default function Conversations() {
  const [seed] = useState(buildConversations) // generate once so list & active id stay in sync
  const [conversations, setConversations] = useState(seed)
  const [activeId, setActiveId] = useState(seed[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('الكل') // 'الكل' | 'غير مقروء'
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0] ?? null

  // Keep the latest message in view when opening a chat or sending
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [active?.id, active?.messages.length])

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
      if (q && !`${c.client} ${c.specialist.name} ${c.lastMessage}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [conversations, search, filter])

  const open = (id) => {
    setActiveId(id)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: false } : c)))
    setDraft('')
  }

  const send = () => {
    const text = draft.trim()
    if (!text || !active) return
    const msg = { id: `${active.id}-m${Date.now()}`, from: 'admin', text, time: new Date().toISOString() }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, msg], lastMessage: text, lastTime: msg.time }
          : c,
      ),
    )
    setDraft('')
  }

  const unreadCount = conversations.filter((c) => c.unread).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-ink">إدارة المحادثات</h2>
        <p className="mt-1 text-sm text-ink-soft">متابعة محادثات العملاء مع الأخصائيين والرد على الاستفسارات</p>
      </div>

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
                      active?.id === c.id ? 'bg-mint/60' : ''
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
                      <span className="text-ink-mute/70">· {active.specialist.title} {active.specialist.name}</span>
                    </p>
                  </div>
                </div>
                <Badge tone="soft">{active.messages.length} رسالة</Badge>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-surface/50 px-5 py-4">
                {active.messages.map((m) => {
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
                })}
              </div>

              <div className="flex items-center gap-2.5 border-t border-line p-3.5">
                <Input
                  placeholder="اكتب رسالتك..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') send()
                  }}
                />
                <Button icon={<Icon name="send" size={17} />} onClick={send} disabled={!draft.trim()}>
                  إرسال
                </Button>
              </div>
            </>
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
    </div>
  )
}

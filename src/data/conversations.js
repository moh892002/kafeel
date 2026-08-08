// Deterministic mock conversations (client <-> admin chat).
import { SPECIALISTS } from './specialists'

export const CLIENT_NAMES = [
  'أحمد الشمري', 'منى الحربي', 'سعود الدوسري', 'لمى الغامدي', 'خالد الزهراني',
  'نورة السبيعي', 'عبدالعزيز القحطاني', 'هند العسيري', 'راكان الجهني', 'جواهر الخالدي',
  'ماجد النفيسة', 'ريم الدوسري', 'سلطان المطيري', 'دانة العنزي', 'بدر الراشد', 'شهد العمري',
]

const CLIENT_MESSAGES = [
  'مساء الخير، أريد حجز جلسة هذا الأسبوع إن أمكن',
  'شكراً جزيلاً، أنا راضٍ جداً عن الجلسة السابقة',
  'هل يمكن تأجيل موعدي ليوم الخميس؟',
  'وصلني رابط الدفع، سأكمل العملية الآن',
  'لدي استفسار عن برنامج التأهيل المهني',
  'شكراً لك، سأنتظر ردك',
  'هل تتوفر جلسات مسائية هذا الأسبوع؟',
  'أود تغيير نوع الجلسة إلى جلسة مكثفة',
  'هل يمكنني استرداد رسوم الجلسة الملغاة؟',
  'ما مواعيد اللقاء الجماعي القادم؟',
]

const ADMIN_MESSAGES = [
  'أهلاً بك، بالتأكيد يمكننا حجز الجلسة، ما الوقت المناسب لك؟',
  'شكراً لثقتك، يسعدنا دائماً تقديم الأفضل لك',
  'لا مشكلة، تم تأجيل موعدك إلى الخميس الساعة 5 مساءً',
  'ممتاز، في حال واجهت أي مشكلة في الدفع أخبرني',
  'بالتأكيد، سأرسل لك تفاصيل البرنامج الكاملة',
  'حاضر، سأرد عليك في أقرب وقت',
  'نعم تتوفر جلسات مسائية من الخامسة حتى التاسعة',
  'تم تحديث الجلسة إلى مكثفة، سأؤكد الموعد الجديد',
  'بالتأكيد، سيتم إرجاع المبلغ خلال 3 أيام عمل',
  'اللقاء القادم يوم الأحد الساعة 7 مساءً',
]

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260811)

function build() {
  const list = []
  const used = new Set()
  let id = 1
  while (list.length < 12) {
    const client = CLIENT_NAMES[Math.floor(rand() * CLIENT_NAMES.length)]
    if (used.has(client)) continue
    used.add(client)

    const specialist = SPECIALISTS[Math.floor(rand() * SPECIALISTS.length)]
    const msgCount = 3 + Math.floor(rand() * 6)
    const messages = []
    const now = new Date()
    let lastTime = now

    for (let i = 0; i < msgCount; i += 1) {
      const from = i % 2 === 0 ? 'client' : 'admin'
      const pool = from === 'client' ? CLIENT_MESSAGES : ADMIN_MESSAGES
      const t = new Date(now)
      t.setMinutes(t.getMinutes() - Math.floor(rand() * 240) - (msgCount - i) * 40)
      lastTime = t
      messages.push({
        id: `${id}-m${i}`,
        from,
        text: pool[Math.floor(rand() * pool.length)],
        time: t.toISOString(),
      })
    }

    list.push({
      id,
      client,
      specialist: { name: specialist.name, title: specialist.title },
      lastMessage: messages[messages.length - 1].text,
      lastTime: lastTime.toISOString(),
      unread: rand() < 0.45,
      online: rand() < 0.6,
      messages,
    })
    id += 1
  }
  return list.sort((a, b) => (a.lastTime < b.lastTime ? 1 : -1))
}

export const buildConversations = build

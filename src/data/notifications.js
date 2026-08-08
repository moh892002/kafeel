// Deterministic mock system notifications.
export const NOTIF_TYPES = ['الكل', 'الحجز', 'الدفع', 'التقييم', 'الأخصائي', 'النظام']

const POOLS = {
  الحجز: [
    { title: 'حجز جلسة جديد', body: 'قام العميل أحمد الشمري بحجز جلسة استشارية مع د. خالد السالم يوم الخميس.' },
    { title: 'إلغاء حجز', body: 'تم إلغاء جلسة مكثفة ليوم الثلاثاء — قام العميل بتأجيل الموعد.' },
    { title: 'تأكيد الحجز', body: 'تم تأكيد حجز جلسة مرئية من قِبل العميل منى الحربي.' },
    { title: 'طلب إعادة جدولة', body: 'طلب العميل سعود الدوسري إعادة جدولة جلسته ليوم الأحد.' },
  ],
  الدفع: [
    { title: 'عملية دفع ناجحة', body: 'تم استلام دفعة 350 ر.س عن جلسة استشارية عبر مدى.' },
    { title: 'دفعة من Apple Pay', body: 'اكتملت عملية دفع عبر Apple Pay بقيمة 490 ر.س.' },
    { title: 'استرداد رسوم', body: 'تمت إعادة مبلغ 250 ر.س للعميل بسبب إلغاء الجلسة.' },
  ],
  التقييم: [
    { title: 'تقييم جديد 5 نجوم', body: 'أضاف العميل تقييماً جديداً بخمس نجوم للأخصائي د. سارة الأحمد.' },
    { title: 'تقييم البرنامج', body: 'حصل برنامج إدارة الضغوط على تقييم 4.7 من 5 بعد تحديث جديد.' },
  ],
  الأخصائي: [
    { title: 'طلب انضمام أخصائي', body: 'تقدم أخصائي تغذية جديد بطلب الانضمام إلى المنصة، بانتظار المراجعة.' },
    { title: 'تحديث بيانات أخصائي', body: 'قام أخصائي بتحديث شهاداته والمؤهلات، بانتظار اعتماد التوثيق.' },
    { title: 'تم توثيق أخصائي', body: 'تم توثيق حساب أخصائي جديد بعد التحقق من بياناته.' },
  ],
  النظام: [
    { title: 'تقرير أسبوعي جاهز', body: 'تم إنشاء التقرير الأسبوعي لأداء المنصة، يمكنك مراجعته من صفحة الأرباح.' },
    { title: 'تحديث المنصة', body: 'تم تحديث المنصة إلى الإصدار 2.4.1 مع تحسينات في الأداء.' },
    { title: 'نسخة احتياطية', body: 'اكتملت النسخة الاحتياطية اليومية لبيانات المنصة بنجاح.' },
  ],
}

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

const rand = mulberry32(20260810)

const TYPE_ORDER = ['الحجز', 'الدفع', 'التقييم', 'الأخصائي', 'النظام']

function build() {
  const list = []
  let id = 1
  for (let i = 0; i < 22; i += 1) {
    const type = TYPE_ORDER[Math.floor(rand() * TYPE_ORDER.length)]
    const pool = POOLS[type]
    const item = pool[Math.floor(rand() * pool.length)]
    const t = new Date()
    t.setHours(t.getHours() - Math.floor(rand() * 140))
    list.push({
      id,
      type,
      title: item.title,
      body: item.body,
      time: t.toISOString(),
      read: rand() < 0.42,
    })
    id += 1
  }
  return list.sort((a, b) => (a.time < b.time ? 1 : -1))
}

export const NOTIFICATIONS = build()

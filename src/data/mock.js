export const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export const revenueSeries = [
  { month: 'يناير', earnings: 42 },
  { month: 'فبراير', earnings: 55 },
  { month: 'مارس', earnings: 48 },
  { month: 'أبريل', earnings: 71 },
  { month: 'مايو', earnings: 63 },
  { month: 'يونيو', earnings: 88 },
  { month: 'يوليو', earnings: 79 },
  { month: 'أغسطس', earnings: 96 },
  { month: 'سبتمبر', earnings: 108 },
  { month: 'أكتوبر', earnings: 92 },
  { month: 'نوفمبر', earnings: 121 },
  { month: 'ديسمبر', earnings: 137 },
]

export const revenueSplit = [
  { name: 'الجلسات', value: 45, color: '#075e66' },
  { name: 'الدورات', value: 28, color: '#2d7f83' },
  { name: 'اللقاءات', value: 17, color: '#75bcba' },
  { name: 'الاشتراكات', value: 10, color: '#c4e2e0' },
]

export const stats = [
  { label: 'الأرباح هذا الشهر', value: '128,450 ر.س', icon: 'wallet', tint: 'teal', delta: 12.4, hint: 'مقارنة بالشهر الماضي' },
  { label: 'إجمالي العملاء', value: '2,847', icon: 'users', tint: 'soft', delta: 8.1, hint: '+214 عميل جديد هذا الشهر' },
  { label: 'الأخصائيين النشطين', value: '186', icon: 'user-check', tint: 'white', delta: 4.6, hint: 'من أصل 212 مسجلاً' },
  { label: 'الدورات المنشورة', value: '64', icon: 'book', tint: 'emerald', delta: -2.3, hint: '52 دورة نشطة حالياً' },
]

export const specialists = [
  { name: 'د. خالد السالم', role: 'استشاري نفسي', rating: 4.9, sessions: 128, status: 'نشط', tone: 'success' },
  { name: 'أ. سارة الأحمد', role: 'أخصائية تغذية', rating: 4.8, sessions: 96, status: 'نشط', tone: 'success' },
  { name: 'د. عبدالله المطيري', role: 'أخصائي أسري', rating: 4.7, sessions: 74, status: 'معلق', tone: 'warning' },
  { name: 'أ. نورة القحطاني', role: 'مدربة مهارات', rating: 4.9, sessions: 143, status: 'نشط', tone: 'success' },
  { name: 'د. فهد العتيبي', role: 'أخصائي علاقات', rating: 4.6, sessions: 61, status: 'موقوف', tone: 'danger' },
]

export const upcomingSessions = [
  { client: 'أحمد الشمري', specialist: 'د. خالد السالم', date: '2026-08-06', time: '10:00 ص', status: 'مؤكدة', tone: 'success' },
  { client: 'منى الحربي', specialist: 'أ. سارة الأحمد', date: '2026-08-06', time: '11:30 ص', status: 'مؤكدة', tone: 'success' },
  { client: 'سعود الدوسري', specialist: 'أ. نورة القحطاني', date: '2026-08-07', time: '09:00 ص', status: 'بانتظار', tone: 'warning' },
  { client: 'لمى الغامدي', specialist: 'د. عبدالله المطيري', date: '2026-08-07', time: '01:00 م', status: 'مؤكدة', tone: 'success' },
  { client: 'خالد الزهراني', specialist: 'د. فهد العتيبي', date: '2026-08-08', time: '04:30 م', status: 'ملغاة', tone: 'danger' },
]

export const topCourses = [
  { title: 'دورة المهارات الأسرية المتقدمة', enrolled: 486, total: 500 },
  { title: 'إدارة الضغوط النفسية', enrolled: 372, total: 400 },
  { title: 'التغذية السليمة للأسرة', enrolled: 289, total: 350 },
  { title: 'فن الحوار الزوجي', enrolled: 205, total: 300 },
  { title: 'تربية الأبناء في العصر الرقمي', enrolled: 148, total: 250 },
]

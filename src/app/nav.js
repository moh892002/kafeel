export const NAV_SECTIONS = [
  {
    items: [{ label: 'الرئيسة', path: '/', icon: 'dashboard' }],
  },
  {
    label: 'إدارة المنصة',
    items: [
      { label: 'الأرباح', path: '/earnings', icon: 'banknote' },
      { label: 'المعاملات', path: '/transactions', icon: 'wallet' },
      { label: 'البرامج', path: '/programs', icon: 'graduation' },
      { label: 'الدورات', path: '/courses', icon: 'book' },
      { label: 'الجلسات', path: '/sessions', icon: 'clipboard' },
      { label: 'اللقاءات', path: '/meetings', icon: 'video' },
      { label: 'العملاء', path: '/clients', icon: 'users' },
      { label: 'إدارة الأخصائيين', path: '/specialists', icon: 'user-check' },
    ],
  },
  {
    label: 'التواصل والإشعارات',
    items: [
      { label: 'إدارة المحادثات', path: '/conversations', icon: 'chat' },
      { label: 'إشعارات النظام', path: '/notifications', icon: 'bell' },
      { label: 'الأسئلة الأكثر تداولاً', path: '/faq', icon: 'help' },
    ],
  },
  {
    label: 'الإعدادات',
    items: [
      { label: 'الإعدادات العامة', path: '/settings', icon: 'settings' },
      { label: 'الحساب الشخصي', path: '/profile', icon: 'user' },
    ],
  },
]

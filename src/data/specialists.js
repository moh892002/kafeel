// UI label constants that are NOT backend enums (specialist specialty is a free-form String,
// and experience/qualification ranges are UI-only vocabulary).
// specialistStatus labels come from GET /api/meta via src/meta.js.
export const SPECIALTY_OPTIONS = [
  'استشاري نفسي', 'أخصائي تغذية', 'أخصائي أسري', 'مدرب مهارات', 'أخصائي علاقات', 'استشاري تربوي',
]

export const TITLE_OPTIONS = ['د.', 'أ.']

export const EXPERIENCE_OPTIONS = ['أقل من سنة', '1 - 3 سنوات', '3 - 5 سنوات', '5 - 10 سنوات', 'أكثر من 10 سنوات']

export const QUALIFICATION_OPTIONS = ['بكالوريوس', 'ماجستير', 'دكتوراه', 'زمالة']

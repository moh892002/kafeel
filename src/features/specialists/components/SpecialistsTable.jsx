import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import Pagination from '@/components/ui/Pagination'
import { STATUS_TONE } from '@/features/specialists/constants'
import { fmtDate, num } from '@/utils/format'

export default function SpecialistsTable({
  rows,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onStatusClick,
  onResetFilters,
}) {
  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
          <Icon name="user-check" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد نتائج مطابقة</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
          جرّب تعديل كلمة البحث أو إعادة تعيين الفلاتر لعرض جميع الأخصائيين.
        </p>
        <Button variant="outline" className="mt-5" onClick={onResetFilters}>
          إعادة تعيين الفلاتر
        </Button>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
              <th className="px-5 py-3 text-start">الأخصائي</th>
              <th className="px-4 py-3 text-start">التخصص</th>
              <th className="px-4 py-3 text-start">التقييم</th>
              <th className="px-4 py-3 text-start">الجلسات</th>
              <th className="px-4 py-3 text-start">الرسوم</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-4 py-3 text-start">تاريخ الانضمام</th>
              <th className="px-5 py-3 text-end">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-mint/40">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size={40} />
                    <div>
                      <p className="flex items-center gap-1.5 font-bold text-ink">
                        {s.title} {s.name}
                        {s.verified && (
                          <Badge tone="soft" compact icon="check">
                            موثق
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-ink-mute">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-semibold text-ink-soft">{s.specialty}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 font-extrabold text-ink">
                    <Icon name="star" size={14} className="text-amber-400" />
                    {Number(s.rating ?? 0).toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(s.sessions)}</td>
                <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(s.fee)} ر.س</td>
                <td className="px-4 py-3.5">
                  <button
                    title="تغيير الحالة"
                    onClick={() => onStatusClick(s)}
                    className="rounded-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <Badge tone={STATUS_TONE[s.status]} dot>
                      {s.status}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3.5 text-ink-soft">{fmtDate(s.joinedAt)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title="عرض التفاصيل"
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                      onClick={() => onView(s)}
                    >
                      <Icon name="eye" size={17} />
                    </button>
                    <button
                      title="تعديل"
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                      onClick={() => onEdit(s)}
                    >
                      <Icon name="edit" size={17} />
                    </button>
                    <button
                      title="حذف"
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                      onClick={() => onDelete(s)}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onChange={onPageChange} />
    </Card>
  )
}

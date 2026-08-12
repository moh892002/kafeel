import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import Pagination from '@/components/ui/Pagination'
import CourseCover from '@/components/ui/CourseCover'
import { Select } from '@/components/ui/Input'
import { statusChoices, useMeta } from '@/app/meta'
import { num } from '@/utils/format'

const LEVEL_TONE = { مبتدئ: 'success', متوسط: 'warning', متقدم: 'danger' }

export default function CoursesTable({
  rows,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  statusBusy,
  onStatusChange,
  onResetFilters,
}) {
  const meta = useMeta()

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center px-6 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
          <Icon name="book" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد دورات مطابقة</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">جرّب تعديل البحث أو الفلاتر، أو أضف دورة جديدة.</p>
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
              <th className="px-5 py-3 text-start">الدورة</th>
              <th className="px-4 py-3 text-start">المدرب</th>
              <th className="px-4 py-3 text-start">المستوى</th>
              <th className="px-4 py-3 text-start">السعر</th>
              <th className="px-4 py-3 text-start">المسجلون</th>
              <th className="px-4 py-3 text-start">التقييم</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-5 py-3 text-end">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-mint/40">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <CourseCover cover={c.cover} className="h-11 w-16 rounded-lg" />
                    <div className="min-w-0">
                      <p className="max-w-[240px] truncate font-bold text-ink">{c.title}</p>
                      <p className="text-xs text-ink-mute">{c.category} · {c.sessions} جلسات</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={c.instructor} size={28} />
                    <span className="whitespace-nowrap font-semibold text-ink-soft">{c.instructor}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Badge tone={LEVEL_TONE[c.level]}>{c.level}</Badge>
                </td>
                <td className="px-4 py-3.5">
                  {Number(c.price) === 0 ? (
                    <Badge tone="soft">مجانية</Badge>
                  ) : (
                    <span className="font-extrabold text-ink">{num(c.price)} ر.س</span>
                  )}
                </td>
                <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(c.enrolled)}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 font-extrabold text-ink">
                    <Icon name="star" size={14} className="text-amber-400" />
                    {c.rating.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <Select
                    className="w-32"
                    value={c.status}
                    disabled={statusBusy === c.id}
                    onChange={(e) => onStatusChange(c, e.target.value)}
                  >
                    {statusChoices(meta, 'courseStatus', c.status).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title="عرض التفاصيل"
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                      onClick={() => onView(c)}
                    >
                      <Icon name="eye" size={17} />
                    </button>
                    <button
                      title="تعديل"
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                      onClick={() => onEdit(c)}
                    >
                      <Icon name="edit" size={17} />
                    </button>
                    <button
                      title="حذف"
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                      onClick={() => onDelete(c)}
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

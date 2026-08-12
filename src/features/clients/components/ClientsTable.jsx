import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import Pagination from '@/components/ui/Pagination'
import { fmtDate, num } from '@/utils/format'

const STATUS_TONE = { نشط: 'success', 'غير نشط': 'neutral' }

export default function ClientsTable({
  rows,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onResetFilters,
}) {
  return (
    <Card className="overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center gap-2 px-6 py-20 text-sm font-bold text-primary">
          <Icon name="loader" size={18} className="animate-spin" />
          جاري تحميل العملاء...
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-20 text-center">
          <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
            <Icon name="users" size={38} strokeWidth={1.6} />
          </div>
          <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد نتائج مطابقة</h3>
          <p className="mt-1.5 max-w-sm text-sm text-ink-soft">جرّب تعديل البحث أو الفلاتر لعرض جميع العملاء.</p>
          <Button variant="outline" className="mt-5" onClick={onResetFilters}>
            إعادة تعيين الفلاتر
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                <th className="px-5 py-3 text-start">العميل</th>
                <th className="px-4 py-3 text-start">المدينة</th>
                <th className="px-4 py-3 text-start">الجلسات</th>
                <th className="px-4 py-3 text-start">الإنفاق</th>
                <th className="px-4 py-3 text-start">التقييم</th>
                <th className="px-4 py-3 text-start">آخر زيارة</th>
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-5 py-3 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-mint/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} size={40} />
                      <div>
                        <p className="flex items-center gap-1.5 font-bold text-ink">
                          {c.name}
                          {c.vip && <Icon name="star" size={13} className="text-amber-400" />}
                        </p>
                        <p className="text-xs text-ink-mute">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-ink-soft">{c.city}</td>
                  <td className="px-4 py-3.5 font-semibold text-ink-soft">{num(c.sessions)}</td>
                  <td className="px-4 py-3.5 font-extrabold text-ink">{num(c.spent)} ر.س</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 font-extrabold text-ink">
                      <Icon name="star" size={14} className="text-amber-400" />
                      {Number(c.rating).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">{fmtDate(c.lastVisit)}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone={STATUS_TONE[c.status]} dot>{c.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end">
                      <button
                        title="عرض الملف"
                        className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                        onClick={() => onView(c)}
                      >
                        <Icon name="eye" size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onChange={onPageChange} />
      )}
    </Card>
  )
}

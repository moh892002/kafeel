import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import Pagination from '@/components/ui/Pagination'
import { STATUS_TONE, fmtTime } from '@/features/sessions/constants'
import { fmtDate, num } from '@/utils/format'

export default function SessionsTable({ rows, page, pageSize, total, onPageChange, onView, onDelete }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
              <th className="px-5 py-3 text-start">العميل</th>
              <th className="px-4 py-3 text-start">الأخصائي</th>
              <th className="px-4 py-3 text-start">النوع</th>
              <th className="px-4 py-3 text-start">الموعد</th>
              <th className="px-4 py-3 text-start">الرسوم</th>
              <th className="px-4 py-3 text-start">الدفع</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-5 py-3 text-end">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-mint/40">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.client} size={40} />
                    <div>
                      <p className="font-bold text-ink">{s.client}</p>
                      <p className="text-xs text-ink-mute">#{s.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={s.specialistName} size={28} />
                    <div>
                      <p className="whitespace-nowrap font-semibold text-ink-soft">
                        {s.specialistTitle} {s.specialistName}
                      </p>
                      <p className="text-[11px] text-ink-mute">{s.specialty}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-semibold text-ink-soft">{s.type}</td>
                <td className="px-4 py-3.5">
                  <p className="font-bold text-ink">{fmtDate(s.date)}</p>
                  <p className="text-xs text-ink-mute">{fmtTime(s.time)}</p>
                </td>
                <td className="px-4 py-3.5 font-semibold text-ink">{num(s.fee)} ر.س</td>
                <td className="px-4 py-3.5 text-ink-soft">{s.payment}</td>
                <td className="px-4 py-3.5">
                  <Badge tone={STATUS_TONE[s.status]} dot>
                    {s.status}
                  </Badge>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title="تفاصيل الجلسة"
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                      onClick={() => onView(s)}
                    >
                      <Icon name="eye" size={17} />
                    </button>
                    <button
                      title="حذف الجلسة"
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

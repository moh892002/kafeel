import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { fmtDate, num } from '@/utils/format'

const SESSION_TONE = { مكتملة: 'success', ملغاة: 'danger' }

export default function SpecialistSessionsTable({ sessions }) {
  if (sessions.length === 0) {
    return <p className="px-4 pb-6 text-sm text-ink-mute">لا توجد جلسات مسجلة لهذا الأخصائي خلال آخر 90 يوم.</p>
  }

  return (
    <>
      <div className="overflow-x-auto pb-3">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">
              <th className="px-4 py-2.5 text-start">العميل</th>
              <th className="px-4 py-2.5 text-start">النوع</th>
              <th className="px-4 py-2.5 text-start">التاريخ</th>
              <th className="px-4 py-2.5 text-start">الوقت</th>
              <th className="px-4 py-2.5 text-start">الرسوم</th>
              <th className="px-4 py-2.5 text-start">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sessions.slice(0, 6).map((se) => (
              <tr key={se.id} className="transition-colors hover:bg-mint/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={se.client} size={32} />
                    <span className="font-bold text-ink">{se.client}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-soft">{se.type}</td>
                <td className="px-4 py-3 text-ink-soft">{fmtDate(se.date)}</td>
                <td className="px-4 py-3 text-ink-soft">{se.time}</td>
                <td className="px-4 py-3 font-semibold text-ink">{num(se.fee)} ر.س</td>
                <td className="px-4 py-3">
                  <Badge tone={SESSION_TONE[se.status]} dot>{se.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sessions.length > 6 && (
        <p className="px-4 pb-4 text-xs font-semibold text-ink-mute">
          + {sessions.length - 6} جلسات أخرى
        </p>
      )}
    </>
  )
}

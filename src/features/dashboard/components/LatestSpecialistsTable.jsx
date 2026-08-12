import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'

export default function LatestSpecialistsTable({ specialists }) {
  const navigate = useNavigate()
  return (
    <Card className="xl:col-span-2">
      <CardHeader
        title="أحدث الأخصائيين"
        subtitle="أحدث الأخصائيين المنضمين للمنصة"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/specialists')}>
            عرض الكل
          </Button>
        }
      />
      <div className="overflow-x-auto px-2 pb-3">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-start text-[11px] font-bold uppercase tracking-wide text-ink-mute">
              <th className="px-3 py-2.5 text-start">الأخصائي</th>
              <th className="px-3 py-2.5 text-start">التقييم</th>
              <th className="px-3 py-2.5 text-start">الجلسات</th>
              <th className="px-3 py-2.5 text-start">الحالة</th>
              <th className="px-3 py-2.5 text-end">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {specialists.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-mint/40">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size={38} />
                    <div>
                      <p className="font-bold text-ink">{s.name}</p>
                      <p className="text-xs text-ink-mute">{s.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1 font-bold text-ink">
                    <Icon name="star" size={14} className="text-amber-400" />
                    {s.rating}
                  </span>
                </td>
                <td className="px-3 py-3 font-semibold text-ink-soft">{s.sessions}</td>
                <td className="px-3 py-3">
                  <Badge tone={s.tone} dot>{s.status}</Badge>
                </td>
                <td className="px-3 py-3 text-end">
                  <button
                    title="عرض الملف"
                    aria-label={`عرض ملف ${s.name}`}
                    onClick={() => navigate(`/specialists/${s.id}`)}
                    className="rounded-lg p-2 text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                  >
                    <Icon name="chevron-left" size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

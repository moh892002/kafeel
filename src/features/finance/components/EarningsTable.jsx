import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { fmtDate, num } from '@/utils/format'

const TX_TONE = { مكتمل: 'success', 'قيد المعالجة': 'warning', مسترد: 'danger' }

export default function EarningsTable({ transactions, periodTitle }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="آخر المعاملات"
        subtitle={`المعاملات المالية خلال ${periodTitle}`}
        actions={<Badge tone="mint">{num(transactions.length)} معاملة</Badge>}
      />
      <div className="overflow-x-auto pb-3">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
              <th className="px-5 py-3 text-start">المعاملة</th>
              <th className="px-4 py-3 text-start">العميل</th>
              <th className="px-4 py-3 text-start">الخدمة</th>
              <th className="px-4 py-3 text-start">طريقة الدفع</th>
              <th className="px-4 py-3 text-start">التاريخ</th>
              <th className="px-4 py-3 text-start">المبلغ</th>
              <th className="px-4 py-3 text-start">العمولة</th>
              <th className="px-5 py-3 text-start">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {transactions.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-mint/40">
                <td className="px-5 py-3.5 font-extrabold text-primary">{t.reference}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={t.client} size={32} />
                    <span className="font-bold text-ink">{t.client}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-ink-soft">{t.service}</td>
                <td className="px-4 py-3.5 text-ink-soft">{t.method}</td>
                <td className="px-4 py-3.5 text-ink-soft">{fmtDate(t.date)}</td>
                <td className="px-4 py-3.5 font-extrabold text-ink">{num(t.amount)} ر.س</td>
                <td className="px-4 py-3.5 text-ink-soft">{num(t.commission)} ر.س</td>
                <td className="px-5 py-3.5">
                  <Badge tone={TX_TONE[t.status]} dot>{t.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

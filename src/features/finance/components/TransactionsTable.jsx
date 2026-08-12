import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import Pagination from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Input'
import { statusChoices, useMeta } from '@/app/meta'
import { fmtDate, num } from '@/utils/format'

export default function TransactionsTable({
  rows,
  page,
  pageSize,
  total,
  onPageChange,
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
          <Icon name="banknote" size={38} strokeWidth={1.6} />
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-ink">لا توجد معاملات مطابقة</h3>
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">جرّب تعديل البحث أو الفلاتر، أو أضف معاملة جديدة.</p>
        <Button variant="outline" className="mt-5" onClick={onResetFilters}>
          إعادة تعيين الفلاتر
        </Button>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/60 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
              <th className="px-5 py-3 text-start">المعاملة</th>
              <th className="px-4 py-3 text-start">العميل</th>
              <th className="px-4 py-3 text-start">الخدمة</th>
              <th className="px-4 py-3 text-start">طريقة الدفع</th>
              <th className="px-4 py-3 text-start">التاريخ</th>
              <th className="px-4 py-3 text-start">المبلغ</th>
              <th className="px-4 py-3 text-start">العمولة</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-5 py-3 text-end">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-mint/40">
                <td className="px-5 py-3.5 font-extrabold text-primary">{t.reference}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={t.client} size={32} />
                    <span className="font-bold text-ink">{t.client ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-ink-soft">{t.service}</td>
                <td className="px-4 py-3.5 text-ink-soft">{t.method}</td>
                <td className="px-4 py-3.5 text-ink-soft">{fmtDate(t.date)}</td>
                <td className="px-4 py-3.5 font-extrabold text-ink">{num(t.amount)} ر.س</td>
                <td className="px-4 py-3.5 text-ink-soft">{num(t.commission)} ر.س</td>
                <td className="px-4 py-3.5">
                  <Select
                    className="w-36"
                    value={t.status}
                    disabled={statusBusy === t.id}
                    onChange={(e) => onStatusChange(t, e.target.value)}
                  >
                    {statusChoices(meta, 'transactionStatus', t.status).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title="تعديل"
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-mint hover:text-primary"
                      onClick={() => onEdit(t)}
                    >
                      <Icon name="edit" size={17} />
                    </button>
                    <button
                      title="حذف"
                      className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-red-50 hover:text-red-500"
                      onClick={() => onDelete(t)}
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

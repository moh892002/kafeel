import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Icon from '@/components/ui/Icon'
import { Input, Select } from '@/components/ui/Input'

export default function TransactionsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statuses,
  from,
  onFromChange,
  to,
  onToChange,
  onExport,
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            icon="search"
            placeholder="ابحث بالمرجع أو العميل أو الخدمة..."
            value={search}
            onChange={onSearchChange}
          />
        </div>
        <Select className="w-40" value={status} onChange={onStatusChange}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input
          className="w-40"
          type="date"
          aria-label="من تاريخ"
          value={from}
          onChange={onFromChange}
        />
        <Input
          className="w-40"
          type="date"
          aria-label="إلى تاريخ"
          value={to}
          onChange={onToChange}
        />
        <Button variant="ghost" icon={<Icon name="download" size={17} />} onClick={onExport}>
          تصدير CSV
        </Button>
      </div>
    </Card>
  )
}

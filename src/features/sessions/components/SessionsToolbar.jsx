import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Icon from '@/components/ui/Icon'
import { Input, Select } from '@/components/ui/Input'
import { sessionTypes, useMeta } from '@/app/meta'
import { SORT_OPTIONS } from '@/features/sessions/constants'

const viewBtn = (active) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition-all ${
    active ? 'bg-white text-primary shadow-card' : 'text-ink-mute hover:text-primary'
  }`

export default function SessionsToolbar({
  search,
  onSearchChange,
  type,
  onTypeChange,
  sort,
  onSortChange,
  showSort,
  view,
  onViewChange,
  onExport,
}) {
  const meta = useMeta()

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            icon="search"
            placeholder="ابحث بالعميل أو الأخصائي أو نوع الجلسة..."
            value={search}
            onChange={onSearchChange}
          />
        </div>

        <Select className="w-44" value={type} onChange={onTypeChange}>
          <option value="الكل">كل الأنواع</option>
          {sessionTypes(meta).map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </Select>

        {showSort && (
          <Select className="w-44" value={sort} onChange={onSortChange}>
            {SORT_OPTIONS.map((o) => (
              <option key={`${o.key}:${o.dir}`} value={`${o.key}:${o.dir}`}>
                {o.label}
              </option>
            ))}
          </Select>
        )}

        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          <button className={viewBtn(view === 'list')} onClick={() => onViewChange('list')}>
            <Icon name="clipboard" size={15} />
            قائمة
          </button>
          <button className={viewBtn(view === 'calendar')} onClick={() => onViewChange('calendar')}>
            <Icon name="calendar" size={15} />
            تقويم
          </button>
        </div>

        <Button variant="ghost" icon={<Icon name="download" size={17} />} onClick={onExport}>
          تصدير CSV
        </Button>
      </div>
    </Card>
  )
}

import Card from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { options, useMeta } from '@/app/meta'

export default function MeetingsToolbar({ search, onSearchChange, type, onTypeChange }) {
  const meta = useMeta()

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            icon="search"
            placeholder="ابحث بعنوان اللقاء أو مقدمه..."
            value={search}
            onChange={onSearchChange}
          />
        </div>
        <Select className="w-44" value={type} onChange={onTypeChange}>
          <option value="الكل">كل الأنواع</option>
          {options(meta, 'meetingType').map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>
    </Card>
  )
}

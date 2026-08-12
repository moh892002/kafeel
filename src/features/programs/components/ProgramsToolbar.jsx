import Card from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { PROGRAM_CATEGORIES, SORT_OPTIONS } from '@/features/programs/constants'

export default function ProgramsToolbar({ search, onSearchChange, category, onCategoryChange, sort, onSortChange }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            icon="search"
            placeholder="ابحث باسم البرنامج أو الفئة..."
            value={search}
            onChange={onSearchChange}
          />
        </div>
        <Select className="w-44" value={category} onChange={onCategoryChange}>
          <option value="الكل">كل الفئات</option>
          {PROGRAM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select className="w-44" value={sort} onChange={onSortChange}>
          {SORT_OPTIONS.map((o) => (
            <option key={`${o.key}:${o.dir}`} value={`${o.key}:${o.dir}`}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </Card>
  )
}

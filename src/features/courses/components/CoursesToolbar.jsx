import Card from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { SORT_OPTIONS } from '@/features/courses/constants'

export default function CoursesToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  sort,
  onSortChange,
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            icon="search"
            placeholder="ابحث بعنوان الدورة أو المدرب..."
            value={search}
            onChange={onSearchChange}
          />
        </div>
        <Select className="w-44" value={category} onChange={onCategoryChange}>
          <option value="الكل">كل الفئات</option>
          {categories.map((c) => (
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

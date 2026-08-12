import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Icon from '@/components/ui/Icon'
import { Input } from '@/components/ui/Input'

export default function SpecialistsToolbar({
  search,
  onSearchChange,
  activeFilterCount,
  onOpenFilter,
  onOpenSort,
  sortLabel,
  onExport,
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            icon="search"
            placeholder="ابحث بالاسم أو التخصص أو البريد الإلكتروني..."
            value={search}
            onChange={onSearchChange}
          />
        </div>

        <Button
          variant={activeFilterCount > 0 ? 'primary' : 'outline'}
          icon={<Icon name="filter" size={17} />}
          onClick={onOpenFilter}
        >
          فلتر
          {activeFilterCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-primary-dark">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Button variant="outline" icon={<Icon name="sort" size={17} />} onClick={onOpenSort}>
          فرز: {sortLabel}
        </Button>

        <Button variant="ghost" icon={<Icon name="download" size={17} />} onClick={onExport}>
          تصدير CSV
        </Button>
      </div>
    </Card>
  )
}

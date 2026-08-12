import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'

export default function Placeholder({ title = 'الصفحة غير موجودة', icon = 'target' }) {
  const navigate = useNavigate()

  return (
    <Card className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="grid size-20 place-items-center rounded-3xl bg-mint text-primary">
        <Icon name={icon} size={40} strokeWidth={1.6} />
      </div>
      <h2 className="mt-6 text-2xl font-extrabold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى رابط آخر.
        تأكد من صحة العنوان أو عد إلى الصفحة الرئيسية.
      </p>
      <span className="mt-6 rounded-full bg-mint px-4 py-1.5 text-xs font-extrabold text-primary">
        404
      </span>
      <Button className="mt-6" icon={<Icon name="home" size={17} />} onClick={() => navigate('/')}>
        العودة إلى الرئيسية
      </Button>
    </Card>
  )
}

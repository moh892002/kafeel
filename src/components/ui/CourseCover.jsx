import Icon from './Icon'

export default function CourseCover({ cover = '#075e66', className = '', iconSize = 18 }) {
  return (
    <div
      className={`grid shrink-0 place-items-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${cover}, ${cover}b3)` }}
    >
      <Icon name="book" size={iconSize} className="text-white/90" />
    </div>
  )
}

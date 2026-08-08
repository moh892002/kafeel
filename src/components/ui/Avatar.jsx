const COLORS = [
  'bg-primary text-white',
  'bg-accent-soft text-white',
  'bg-[#3e8e94] text-white',
  'bg-[#5aa9a0] text-white',
  'bg-[#28737a] text-white',
  'bg-[#6ab8b4] text-white',
]

function hash(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 997
  return h
}

export default function Avatar({ name = '', size = 40, className = '', src, rounded = 'rounded-full' }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const style = {
    width: size,
    height: size,
    fontSize: size * 0.36,
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`shrink-0 object-cover ${rounded} ${className}`}
      />
    )
  }

  return (
    <div
      style={style}
      title={name}
      className={`grid shrink-0 select-none place-items-center font-bold ${COLORS[hash(name) % COLORS.length]} ${rounded} ${className}`}
    >
      {initials}
    </div>
  )
}

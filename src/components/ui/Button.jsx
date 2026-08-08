export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  type = 'button',
  ...rest
}) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-deep active:bg-primary-dark shadow-[0_4px_14px_rgba(7,94,102,0.35)]',
    soft: 'bg-mint text-primary hover:bg-accent/30',
    outline: 'border border-primary/25 text-primary bg-white hover:bg-mint',
    ghost: 'text-primary hover:bg-mint',
    danger: 'bg-[#e04545] text-white hover:bg-[#c93b3b] shadow-[0_4px_14px_rgba(224,69,69,0.3)]',
    white: 'bg-white text-primary hover:bg-mint shadow-card',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2',
  }

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

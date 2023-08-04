import AppIcon from "./AppIcon"
import LoadingSpin from "./LoadingSpin"

interface Props {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
  className?: string
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  children?: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  isLoading,
  children
}: Props) {

  const variantClass: 'btn-primary' | 'btn-secondary' | 'btn-small' = `btn-${variant}`
  const sizeClass = size == 'sm' ? 'text-sm px-2 py-1 md:px-3 md:py-1' : 'px-3 py-3'

  return (
    <button
      className={`btn w-full ${className} ${sizeClass} ${variantClass}`}
      onClick={onClick}
    >
      {isLoading && <LoadingSpin />}
      {children}
    </button>
  )
}
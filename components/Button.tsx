import AppIcon from "./AppIcon"
import LoadingSpin from "./LoadingSpin"

interface Props {
  variant?: 'primary' | 'secondary'
  className?: string
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  children?: React.ReactNode
}

export default function Button({
  variant = 'primary',
  className,
  onClick,
  isLoading,
  children
}: Props) {

  const variantClass: 'btn-primary' | 'btn-secondary' = `btn-${variant}`

  return (
    <button
      className={`btn px-3 py-3 w-full ${className} ${variantClass}`}
      onClick={onClick}
    >
      {isLoading && <LoadingSpin />}
      {children}
    </button>
  )
}
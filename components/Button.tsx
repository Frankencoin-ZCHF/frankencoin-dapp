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
  error?: string
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  isLoading,
  children,
  disabled,
  error
}: Props) {

  const variantClass: 'btn-primary' | 'btn-secondary' | 'btn-small' = `btn-${variant}`
  const sizeClass = size == 'sm' ? 'text-sm px-2 py-1 md:px-3 md:py-1' : 'px-3 py-3'

  return (
    <>
      {error &&
        <div className="mb-2 px-1 text-red-500 text-center">
          {error}
        </div>
      }
      <button
        className={`btn w-full ${className} ${sizeClass} ${variantClass} ${disabled && 'cursor-not-allowed bg-gray-500'}`}
        onClick={() => !disabled && onClick?.()}
      >
        {isLoading && <LoadingSpin />}
        {children}
      </button>
    </>
  )
}
import Link from "next/link"
import AppIcon from "./AppIcon"

interface Props {
  to?: string
  loading?: boolean
  className?: string
  icon?: string
  size?: 'small' | 'medium' | 'large'
  children?: React.ReactNode
}

export default function AppButton({
  to,
  loading,
  icon,
  className,
  size,
  children
}: Props) {
  const sizeClass =
    size == 'small' ? 'px-2 py-1 md:px-3 md:py-1 text-sm' : size === 'medium' ? 'px-3 py-2 md:px-3 md:py-3' : '';

  className += ` ${sizeClass}`;
  return to ? (
    <Link href={to} className={className}>
      {children}
    </Link>
  ) : (
    <button className={className}>
      {loading && <AppIcon src="/assets/loader.svg" size="small" />}
      {!loading && icon && <AppIcon src={icon} />}
      {children}
    </button>
  )
}
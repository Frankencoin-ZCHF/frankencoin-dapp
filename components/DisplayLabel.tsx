
interface Props {
  label?: string,
  children?: React.ReactNode
}

export default function DisplayLabel({
  label,
  children,
}: Props) {
  return (
    <div>
      <div className="text-sm text-gray-400">
        {label}
      </div>
      {children}
    </div>
  )
}
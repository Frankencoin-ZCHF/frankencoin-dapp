interface Props {
  children: React.ReactNode
}

export default function AppForm({
  children
}: Props) {
  return (
    <form>
      {children}
      <div className="mx-auto mt-8 w-72 max-w-full flex-col">

      </div>
    </form>
  )
}
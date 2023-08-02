interface Props {
  title: string
}

export default function AppPageHeader({
  title
}: Props) {
  return (
    <section className="flex grid-cols-8 flex-col gap-2 py-4 sm:flex-row lg:grid">
      <div></div>
      <h1
        className="font-xl col-span-6 flex-1 text-center text-xl font-bold"
      >{title}</h1>
    </section>
  )
}
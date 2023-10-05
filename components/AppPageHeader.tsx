import Link from "next/link";

interface Props {
  title: string;
  className?: string;
  link?: string;
  backTo?: string;
  backText?: string;
}

export default function AppPageHeader({
  title,
  className,
  link,
  backTo,
  backText,
}: Props) {
  return (
    <section
      className={`my-5 flex grid-cols-8 flex-col gap-2 py-4 sm:flex-row lg:grid ${className}`}
    >
      <div>
        {backTo && (
          <Link href={backTo} className="text-link">
            {backText}
          </Link>
        )}
      </div>
      <h1 className="font-xl col-span-6 flex-1 text-center text-xl font-bold">
        {link ? (
          <Link href={link} target="_blank" className="text-link">
            {title}
          </Link>
        ) : (
          title
        )}
      </h1>
    </section>
  );
}

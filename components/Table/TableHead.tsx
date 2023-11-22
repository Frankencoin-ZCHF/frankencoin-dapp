interface Props {
  headers: string[];
  actionCol?: boolean;
}

export default function TableHeader({ headers, actionCol }: Props) {
  return (
    <div className="hidden items-center justify-between rounded-t-lg bg-slate-800 py-5 px-8 md:flex xl:px-16">
      <div
        className={`hidden flex-grow grid-cols-2 items-center text-gray-300 md:grid md:grid-cols-${headers.length}`}
      >
        {headers.map((header, i) => (
          <span className="leading-tight" key={`table-header-${i}`}>
            {header}
          </span>
        ))}
      </div>
      {actionCol && <div className="w-40 flex-shrink-0"></div>}
    </div>
  );
}

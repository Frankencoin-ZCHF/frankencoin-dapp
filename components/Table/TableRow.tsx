import Link from "next/link";
import React from "react";

interface Props {
  children: React.ReactElement[];
  actionCol?: React.ReactElement;
  link?: string;
}

export default function TableRow({ children, actionCol, link }: Props) {
  return (
    <Link
      className={`bg-white dark:bg-slate-800 dark:hover:bg-slate-700 px-8 py-8 xl:px-16 border-t border-slate-700 last:rounded-b-lg duration-300 ${
        link && "cursor-pointer"
      }`}
      href={link || "#"}
    >
      <div className="flex flex-col justify-between gap-y-5 md:flex-row md:space-x-4">
        <div
          className={`grid flex-grow grid-cols-2 gap-3 sm:grid-cols-${children.length} items-center`}
        >
          {children}
        </div>
        {actionCol && <div className="flex-shrink-0 md:w-40">{actionCol}</div>}
      </div>
    </Link>
  );
}

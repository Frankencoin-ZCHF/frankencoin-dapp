import React from "react";

interface Props {
  children: React.ReactElement | string;
}

export default function TableRowEmpty({ children }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 dark:hover:bg-slate-700 px-8 py-8 xl:px-16 border-t border-slate-700 last:rounded-b-lg duration-300">
      <div className="flex flex-col justify-between gap-y-5 md:flex-row md:space-x-4">
        {children}
      </div>
    </div>
  );
}

import React from "react";

interface Props {
	children: React.ReactElement | string;
}

export default function TableRowEmpty({ children }: Props) {
	return (
		<div className="bg-table-row-primary hover:bg-table-row-hover py-8 max-md:px-8 md:px-16 xl:px-20 first:border-t-0 sm:first:border-t border-t border-table-row-hover first:rounded-t-lg sm:first:rounded-t-none last:rounded-b-lg duration-300">
			<div className="flex flex-col text-text-primary justify-between gap-y-5 md:flex-row md:space-x-4">{children}</div>
		</div>
	);
}

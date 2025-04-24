import React from "react";

interface Props {
	children: React.ReactElement | string;
}

export default function TableRowEmpty({ children }: Props) {
	return (
		<div className="bg-table-row-primary md:hover:bg-table-row-hover py-8 max-md:px-8 md:px-16 xl:px-20 first:border-t-1 border-t border-table-row-hover last:rounded-b-xl duration-300">
			<div className="flex flex-col text-text-secondary justify-between gap-y-5 md:flex-row md:space-x-4">{children}</div>
		</div>
	);
}

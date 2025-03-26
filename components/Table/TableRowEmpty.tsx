import React from "react";

interface Props {
	children: React.ReactElement | string;
	className?: string;
}

export default function TableRowEmpty({ children, className }: Props) {
	return (
		<div className={`${className} bg-table-row-primary cursor-default py-8 max-md:px-8 md:px-16 xl:px-20 sm:first:border-t border-t border-table-row-hover sm:first:rounded-t-none last:rounded-b-xl duration-300`}>
			<div className="flex flex-col text-text-muted justify-between gap-y-5 md:flex-row md:space-x-4">{children}</div>
		</div>
	);
}
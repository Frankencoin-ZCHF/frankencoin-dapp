import Link from "next/link";
import React from "react";

interface Props {
	children: React.ReactElement[];
	actionCol?: React.ReactElement;
	link?: string;
	colSpan?: number;
}

export default function TableRow({ colSpan, children, actionCol, link }: Props) {
	return (
		<Link
			className={`bg-tableRow-primary hover:bg-tableRow-hover px-8 py-8 xl:px-16 first:border-t-0 sm:first:border-t border-t border-tableRow-hover first:rounded-t-lg sm:first:rounded-t-none last:rounded-b-lg duration-300 ${
				link && "cursor-pointer"
			}`}
			href={link || "#"}
		>
			<div className="flex flex-col justify-between gap-y-5 md:flex-row md:space-x-4">
				<div className={`grid flex-grow grid-cols-2 sm:grid-cols-${colSpan || children.length} items-center`}>{children}</div>
				{actionCol && <div className="flex-shrink-0 md:w-40">{actionCol}</div>}
			</div>
		</Link>
	);
}

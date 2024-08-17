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
			className={`cursor-default bg-tableRow-primary hover:bg-tableRow-hover px-8  xl:px-12 py-4 first:border-t-0 sm:first:border-t border-t border-tableRow-hover first:rounded-t-lg sm:first:rounded-t-none last:rounded-b-lg duration-300`}
			href={link || "#"}
		>
			<div className="flex sm:pl-8 flex-col justify-between gap-y-5 md:flex-row">
				<div
					className={`sm:text-right max-sm:text-center grid flex-grow grid-cols-1 sm:grid-cols-${
						colSpan || children.length
					} max-md:justify-items-center items-center max-md:gap-6`}
				>
					{children}
				</div>
				{actionCol && <div className="flex-shrink-0 md:w-[8rem] md:ml-[2rem] max-md:w-full my-2">{actionCol}</div>}
			</div>
		</Link>
	);
}

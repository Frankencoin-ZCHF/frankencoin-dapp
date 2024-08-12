import { useState } from "react";

interface Props {
	headers: string[];
	subHeaders?: string[];
	actionCol?: boolean;
	colSpan?: number;
	tab?: string;
	tabOnChange?: Function;
}

export default function TableHeader({ headers, subHeaders, actionCol, colSpan, tab = "", tabOnChange }: Props) {
	const handleOnClick = function (active: string) {
		if (typeof tabOnChange === "function") tabOnChange(active);
	};

	return (
		<div className="hidden items-center justify-between rounded-t-lg bg-tableHeader-primary py-5 px-8 md:flex xl:px-12">
			<div className={`hidden pl-8 flex-grow grid-cols-2 items-center md:grid md:grid-cols-${colSpan || headers.length}`}>
				{headers.map((header, i) => (
					<div key={`table-header-${i}`} onClick={(e) => handleOnClick(header)}>
						<span className={`text-gray-300 ${tab === header ? "text-red-600" : "text-gray-300"}`}>{header}</span>
					</div>
				))}
				{subHeaders
					? subHeaders.map((header, i) => (
							<span className="text-gray-500" key={`table-header-${i}`}>
								{header}
							</span>
					  ))
					: null}
			</div>
			{actionCol && <div className="w-40 flex-shrink-0">Action</div>}
		</div>
	);
}

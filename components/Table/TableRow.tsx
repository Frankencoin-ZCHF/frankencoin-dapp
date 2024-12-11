import React from "react";

interface Props {
	children: React.ReactElement[];
	actionCol?: React.ReactElement;
	link?: string;
	colSpan?: number;
	className?: string;
	classNameMobile?: string;
	headers?: string[];
	subHeaders?: string[];
}

export default function TableRow({
	colSpan,
	children,
	actionCol,
	link,
	headers = [],
	subHeaders = [],
	className,
	classNameMobile = "",
}: Props) {
	return (
		<div
			className={`${
				className ?? "bg-table-row-primary md:hover:bg-table-row-hover"
			} cursor-default px-8  xl:px-12 py-4 border-t border-table-row-hover last:rounded-b-xl duration-300`}
		>
			<div className="flex sm:pl-8 flex-col justify-between gap-y-5 md:flex-row">
				{/* @dev: this is desktop view */}
				<div className={`max-md:hidden text-right grid flex-grow grid-cols-${colSpan || children.length} items-center`}>
					{children}
				</div>

				{/* @dev: this is mobile view */}
				<TableRowMobile headers={headers} subHeaders={subHeaders} className={classNameMobile}>
					{children}
				</TableRowMobile>

				{/* @dev: this is desktop/mobile action view */}
				{actionCol && <div className="flex-shrink-0 md:w-[8rem] md:ml-[2rem] max-md:w-full my-2">{actionCol}</div>}
			</div>
		</div>
	);
}

interface TableRowMobileProps {
	children: React.ReactElement[];
	headers: string[];
	subHeaders: string[];
	className: string;
}

function TableRowMobile({ children, headers, subHeaders, className }: TableRowMobileProps) {
	if (headers.length === 0) {
		return <div className={`${className} md:hidden justify-items-center text-center gap-6 grid flex-grow grid-cols-1`}>{children}</div>;
	} else {
		return (
			<div className={`${className} md:hidden gap-6 grid-cols-1 flex-1`}>
				{children.map((c, idx) => (
					<div className="mt-2 flex" key={c.key}>
						<div className="flex-1 text-left">
							{idx === 0 ? (
								c
							) : subHeaders.length === 0 ? (
								headers[idx]
							) : (
								<div>
									<div>{headers[idx]}</div>
									<div className="text-sm text-text-subheader">{subHeaders[idx]}</div>
								</div>
							)}
						</div>
						<div className="text-right">{idx === 0 ? "" : c}</div>
					</div>
				))}
			</div>
		);
	}
}

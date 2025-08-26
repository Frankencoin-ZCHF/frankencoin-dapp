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
	tab: string;
	showFirstHeader?: boolean;
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
	tab,
	showFirstHeader = false,
}: Props) {
	return (
		<div
			className={`${
				className ?? "bg-table-row-primary"
			} cursor-default px-5 py-5 ${actionCol ? "sm:pr-12" : ""} sm:px-8 sm:py-4 border-t border-table-row-hover sm:first:rounded-t-none last:rounded-b-xl duration-300`}
		>
			<div className="flex flex-col justify-between gap-y-5 md:flex-row">
				{/* @dev: this is desktop view */}
				<div 
					className="max-md:hidden text-right grid font-medium flex-grow items-center"
					style={{ gridTemplateColumns: `repeat(${colSpan || children.length}, minmax(0, 1fr))` }}
				>
					{children}
				</div>

				{/* @dev: this is mobile view */}
				<TableRowMobile headers={headers} subHeaders={subHeaders} className={classNameMobile} tab={tab} showFirstHeader={showFirstHeader}>
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
	tab: string;
	showFirstHeader?: boolean;
}

function TableRowMobile({ children, headers, subHeaders, className, tab, showFirstHeader = false }: TableRowMobileProps) {
	if (headers.length === 0) {
		return <div className={`${className} md:hidden justify-items-center text-center gap-6 grid flex-grow grid-cols-1`}>{children}</div>;
	} else {
		return (
			<div className={`${className} md:hidden grid-cols-1 flex-1`}>
				{children.map((c, idx) => (
					<div className="mt-1.5 flex" key={headers[idx] + idx}>
						<div className="flex-1 text-left">
							{idx === 0 ? (
								<>
									{showFirstHeader && <div className={`mb-2 ${headers[idx] == tab ? "text-text-primary font-bold" : "text-text-muted"}`}>{headers[idx]}</div>}
									<div className={`${headers[idx] == tab ? "text-text-primary font-bold" : "text-text-muted"}`}>{c}</div>
								</>
							) : subHeaders.length === 0 ? (
								<div className={`${headers[idx] == tab ? "text-text-primary font-bold" : "text-text-muted"}`}>
									{headers[idx]}
								</div>
							) : (
								<div>
									<div className={`${headers[idx] == tab ? "text-text-primary font-bold" : "text-text-muted"}`}>
										{headers[idx]}
									</div>
									<div className={`${headers[idx] == tab ? "text-text-subheader font-bold" : "text-text-muted"}`}>
										{subHeaders[idx]}
									</div>
								</div>
							)}
						</div>
						<div className={`${headers[idx] == tab ? "!text-text-primary !font-bold" : "!text-text-muted"} text-right`}>
							{idx === 0 ? "" : c}
						</div>
					</div>
				))}
			</div>
		);
	}
}

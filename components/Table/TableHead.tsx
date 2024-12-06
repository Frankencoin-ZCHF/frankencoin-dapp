import { faArrowDownWideShort, faArrowUpShortWide } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
	headers: string[];
	subHeaders?: string[];
	actionCol?: boolean;
	colSpan?: number;
	tab?: string;
	reverse?: boolean;
	tabOnChange?: Function;
}

export default function TableHeader({ headers, subHeaders, actionCol, colSpan, tab = "", reverse = false, tabOnChange }: Props) {
	const handleOnClick = function (active: string) {
		if (typeof tabOnChange === "function") tabOnChange(active);
	};

	return (
		<div className="hidden items-center justify-between rounded-t-xl bg-table-header-primary py-5 px-8 md:flex xl:px-12">
			<div className={`hidden pl-8 flex-grow grid-cols-2 md:grid md:grid-cols-${colSpan || headers.length}`}>
				{headers.map((header, i) => (
					<div className={`${i > 0 ? "text-right" : ""}`} key={`table-header-${i}`} onClick={(e) => handleOnClick(header)}>
						<span
							className={`font-bold ${!!tab ? "cursor-pointer" : ""} ${
								tab === header ? "text-text-active" : "text-text-header "
							}`}
						>
							{header}
						</span>
						{tab === header ? (
							<FontAwesomeIcon
								icon={reverse ? faArrowUpShortWide : faArrowDownWideShort}
								className="ml-2 cursor-pointer"
								color="#092f62"
							/>
						) : null}
					</div>
				))}
				{subHeaders
					? subHeaders.map((header, i) => (
							<div className={`${i > 0 ? "text-right" : ""}`} key={`table-header-${i}`}>
								<span className="text-text-subheader">{header}</span>
							</div>
					  ))
					: null}
			</div>
			{actionCol && (
				<div>
					<div className={`text-text-header text-right w-40 flex-shrink-0 ${subHeaders ? "items-center" : ""}`}>Action</div>
					{subHeaders ? <span> </span> : null}
				</div>
			)}
		</div>
	);
}

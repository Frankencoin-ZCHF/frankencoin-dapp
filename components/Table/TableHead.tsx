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
		<div className="hidden items-center justify-between rounded-t-lg bg-table-header-primary py-5 px-8 md:flex xl:px-8">
			<div className={`hidden flex-grow grid-cols-2 md:grid md:grid-cols-${colSpan || headers.length}`}>
				{headers.map((header, i) => (
					<div className={`text-text-header ${i > 0 ? "text-right" : ""}`} key={`table-header-${i}`} onClick={(e) => handleOnClick(header)}>
						<span className={`text-base font-extrabold ${!!tab ? "cursor-pointer" : ""} ${tab === header ? "text-table-header-active font-bold" : ""}`}>
							{header}
						</span>
						{tab === header ? (
							<FontAwesomeIcon
								icon={reverse ? faArrowUpShortWide : faArrowDownWideShort}
								className="ml-2 cursor-pointer text-table-header-active"
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
					<div className={`text-base font-extrabold text-table-header-action  text-right w-40 flex-shrink-0 ${subHeaders ? "items-center" : ""}`}>Action</div>
					{subHeaders ? <span> </span> : null}
				</div>
			)}
		</div>
	);
}


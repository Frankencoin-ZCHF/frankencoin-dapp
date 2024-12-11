import SortBySelect from "@components/Input/SortBySelect";
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
		<div className="items-center justify-between rounded-t-xl bg-table-header-primary py-5 px-8 md:flex xl:px-12">
			{/* @dev: this is desktop view */}
			<div className={`max-md:hidden pl-8 flex-grow grid-cols-2 md:grid md:grid-cols-${colSpan || headers.length}`}>
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
				<div className="max-md:hidden">
					<div className={`text-text-header text-right w-40 flex-shrink-0 ${subHeaders ? "items-center" : ""}`}>Action</div>
					{subHeaders ? <span> </span> : null}
				</div>
			)}

			{/* @dev: this is mobile view */}
			<TableHeadMobile headers={headers} tab={tab} reverse={reverse} tabOnChange={handleOnClick} />
		</div>
	);
}

interface TableHeadMobileProps {
	headers: string[];
	tab: string;
	reverse: boolean;
	tabOnChange: Function;
}

function TableHeadMobile({ headers, tab, reverse, tabOnChange }: TableHeadMobileProps) {
	return (
		<div className="md:hidden flex items-center">
			<div className="flex-1 justify-start font-semibold text-text-secondary">Sort By</div>

			<div className="flex justify-end">
				<SortBySelect headers={headers} tab={tab} reverse={reverse} tabOnChange={tabOnChange} />
			</div>
		</div>
	);
}

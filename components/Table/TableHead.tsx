import SortBySelect from "@components/Input/SortBySelect";
import { faArrowDownWideShort, faArrowUpShortWide } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "next-i18next";

interface Props {
	headers: string[];
	subHeaders?: string[];
	actionCol?: boolean;
	colSpan?: number;
	tab?: string;
	reverse?: boolean;
	tabOnChange?: Function;
	headerClassNames?: string[];
	className?: string;
}

export default function TableHeader({ headers, subHeaders, actionCol, colSpan, tab = "", reverse = false, tabOnChange, headerClassNames, className }: Props) {
	const { t } = useTranslation();

	const handleOnClick = function (active: string) {
		if (typeof tabOnChange === "function") tabOnChange(active);
	};

	return (
		<div className={`${className} items-center justify-between rounded-t-xl bg-table-header-primary ${actionCol ? "sm:pr-12" : ""} py-3 px-5 pr-3 sm:py-5 sm:px-8 md:flex`}>
			<div className={`max-md:hidden flex-grow grid-cols-2 md:grid md:grid-cols-${colSpan || headers.length}`}>
				{headers.map((header, i) => (
					<div
						className={`text-text-header ${i > 0 ? "text-right" : ""} ${headerClassNames?.[i] ?? ""}`}
						key={`table-header-${i}`}
						onClick={(e) => handleOnClick(header)}
					>
						<span
							className={`text-base font-extrabold transition-colors duration-200 ${!!tab ? "cursor-pointer" : ""} ${
								tab === header ? "text-table-header-active font-bold" : "text-table-header-default hover:text-table-header-hover"
							}
							`}
						>
							{header}
						</span>
						{tab === header ? (
							<FontAwesomeIcon
								icon={reverse ? faArrowUpShortWide : faArrowDownWideShort}
								className="ml-2 cursor-pointer text-table-header-active"
								color="#092f62"
							/>
						) : null}
					</div>
				))}
				{subHeaders
					? subHeaders.map((header, i) => (
							<div className={`${i > 0 ? "text-right" : ""} ${headerClassNames?.[i] ?? ""}`} key={`table-header-${i}`}>
								<span className="text-text-subheader">{header}</span>
							</div>
					  ))
					: null}
			</div>
			{actionCol && (
				<div className="max-md:hidden">
					<div
						className={`text-base font-extrabold text-table-header-action  text-right w-40 flex-shrink-0 ${
							subHeaders ? "items-center" : ""
						}`}
					>
						{t('common.action')}
					</div>
					{subHeaders ? <span> </span> : null}
				</div>
			)}
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
			<div className="flex-1 justify-start font-semibold text-text-muted">Sort By</div>
			<div className="flex justify-end">
				<SortBySelect headers={headers} tab={tab} reverse={reverse} tabOnChange={tabOnChange} />
			</div>
		</div>
	);
}

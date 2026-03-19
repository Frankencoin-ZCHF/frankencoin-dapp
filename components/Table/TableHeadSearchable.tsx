import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDownWideShort, faArrowUpShortWide, faMagnifyingGlass, faSlidersH } from "@fortawesome/free-solid-svg-icons";
import SortBySelect from "@components/Input/SortBySelect";

export interface FilterOption {
	label: string;
	value: string;
}

interface Props {
	// Search
	searchPlaceholder?: string;
	searchValue: string;
	onSearchChange: (value: string) => void;

	// In my wallet toggle
	inMyWallet: boolean;
	onInMyWalletChange: (value: boolean) => void;

	// Category filter
	filterOptions: FilterOption[];
	activeFilters: string[];
	onFiltersChange: (filters: string[]) => void;

	// Table column headers (same as TableHead)
	headers: string[];
	subHeaders?: string[];
	actionCol?: boolean;
	colSpan?: number;
	tab?: string;
	reverse?: boolean;
	tabOnChange?: Function;
}

export default function TableHeadSearchable({
	searchPlaceholder = "Search",
	searchValue,
	onSearchChange,
	inMyWallet,
	onInMyWalletChange,
	filterOptions,
	activeFilters,
	onFiltersChange,
	headers,
	subHeaders,
	actionCol,
	colSpan,
	tab = "",
	reverse = false,
	tabOnChange,
}: Props) {
	const [filterOpen, setFilterOpen] = useState(false);
	const filterRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
				setFilterOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleTabClick = (header: string) => {
		if (typeof tabOnChange === "function") tabOnChange(header);
	};

	const toggleFilter = (value: string) => {
		if (activeFilters.includes(value)) {
			onFiltersChange(activeFilters.filter((f) => f !== value));
		} else {
			onFiltersChange([...activeFilters, value]);
		}
	};

	return (
		<div className="rounded-t-lg bg-table-header-primary">
			{/* Search / toggle / filter bar */}
			<div className="grid grid-cols-1 md:flex md:items-center md:justify-between px-7 xl:px-11 py-4 border-b border-gray-100 dark:border-gray-700 gap-3">
				{/* Search input */}
				<div className="flex items-center gap-2 text-text-secondary">
					<FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-text-secondary" />
					<input
						type="text"
						value={searchValue}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						className="bg-transparent outline-none text-sm text-text-primary placeholder:text-text-secondary w-full md:w-64"
					/>
				</div>

				{/* Right controls */}
				<div className="flex items-center justify-end gap-5">
					{/* In my wallet toggle */}
					<div className="flex items-center gap-2">
						<button
							role="switch"
							aria-checked={inMyWallet}
							onClick={() => onInMyWalletChange(!inMyWallet)}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
								inMyWallet ? "bg-button-default" : "bg-gray-300 dark:bg-gray-600"
							}`}
						>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
									inMyWallet ? "translate-x-6" : "translate-x-1"
								}`}
							/>
						</button>
						<span className="text-sm text-text-secondary whitespace-nowrap">In my wallet</span>
					</div>

					{/* Filter button + dropdown */}
					<div className="relative" ref={filterRef}>
						<button
							onClick={() => setFilterOpen((prev) => !prev)}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
								filterOpen || activeFilters.length > 0
									? "border-button-default text-button-default bg-blue-50 dark:bg-blue-900/20"
									: "dark:border-gray-600 text-text-secondary hover:bg-button-disabled"
							}`}
						>
							<FontAwesomeIcon icon={faSlidersH} className="w-3.5 h-3.5" />
							<span>Filter</span>
							{activeFilters.length > 0 && (
								<span className="ml-1 bg-button-default text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
									{activeFilters.length}
								</span>
							)}
						</button>

						{filterOpen && (
							<div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-3">
								<div className="px-4 pb-2">
									<span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
										Asset Categories
									</span>
								</div>
								{filterOptions.map((opt) => (
									<label
										key={opt.value}
										className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
									>
										<input
											type="checkbox"
											checked={activeFilters.includes(opt.value)}
											onChange={() => toggleFilter(opt.value)}
											className="w-4 h-4 rounded active:bg-button-default"
										/>
										<span className="text-sm text-text-primary">{opt.label}</span>
									</label>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Column headers — desktop */}
			<div className="items-center justify-between py-4 px-8 md:flex xl:px-12">
				<div className={`max-md:hidden pl-8 flex-grow grid-cols-2 md:grid md:grid-cols-${colSpan || headers.length}`}>
					{headers.map((header, i) => (
						<div className={`${i > 0 ? "text-right" : ""}`} key={`th-${i}`} onClick={() => handleTabClick(header)}>
							<span
								className={`font-bold ${!!tab ? "cursor-pointer" : ""} ${
									tab === header ? "text-text-active" : "text-text-header"
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
					{subHeaders &&
						subHeaders.map((header, i) => (
							<div className={`${i > 0 ? "text-right" : ""}`} key={`th-sub-${i}`}>
								<span className="text-text-subheader">{header}</span>
							</div>
						))}
				</div>
				{actionCol && (
					<div className="max-md:hidden">
						<div className={`text-text-header text-right w-10 flex-shrink-0 ${subHeaders ? "items-center" : ""}`}></div>
						{subHeaders ? <span> </span> : null}
					</div>
				)}

				{/* Column headers — mobile */}
				<div className="md:hidden flex items-center">
					<div className="flex-1 justify-start font-semibold text-text-secondary">Sort By</div>
					<div className="flex justify-end">
						<SortBySelect headers={headers} tab={tab} reverse={reverse} tabOnChange={handleTabClick} />
					</div>
				</div>
			</div>
		</div>
	);
}

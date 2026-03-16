import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faChevronDown, faDownload } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

interface CalendarDropdownProps {
	onDownloadICS: () => void;
	onGoogleCalendar: () => void;
	label?: string;
	title?: string;
}

export default function CalendarDropdown({
	onDownloadICS,
	onGoogleCalendar,
	label = "Expiration Calendar",
	title = "Add expiration alerts to your calendar",
}: CalendarDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div className="relative inline-block" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"
				title={title}
			>
				<FontAwesomeIcon icon={faCalendarDays} className="mr-2" />
				{label}
				<FontAwesomeIcon icon={faChevronDown} className={`ml-2 w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
					<div className="py-1">
						<button
							onClick={() => {
								onGoogleCalendar();
								setIsOpen(false);
							}}
							className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center"
						>
							<FontAwesomeIcon icon={faGoogle} className="mr-3 w-4 text-[#4285F4]" />
							Add to Google Calendar
						</button>
						<button
							onClick={() => {
								onDownloadICS();
								setIsOpen(false);
							}}
							className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center"
						>
							<FontAwesomeIcon icon={faDownload} className="mr-3 w-4 text-slate-500" />
							Download ICS file
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

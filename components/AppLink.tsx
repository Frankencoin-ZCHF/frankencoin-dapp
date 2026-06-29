import { faArrowUpRightFromSquare, faCircleArrowRight, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { track } from "../hooks/useAnalytics";

interface Props {
	label: string;
	href?: string;
	external?: boolean;
	icon?: boolean;
	copy?: boolean;
	copyValue?: string;
	className?: string;
}

export default function AppLink({ label, href = "/", external = false, icon = false, copy = false, copyValue, className }: Props) {
	const umamiEvent = (external ? "external_link_" : "link_") + label.toLowerCase().replace(/\s+/g, "_");

	const linkEl = (
		<Link
			className={`${
				copy ? "" : (className ?? "flex items-center justify-end pt-2") + " "
			}text-card-input-max hover:text-card-input-hover cursor-pointer`}
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noreferrer" : undefined}
			onClick={() => track(umamiEvent)}
		>
			<span>
				{label}
				{!icon && !external ? null : external ? (
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />
				) : (
					<FontAwesomeIcon icon={faCircleArrowRight} className="w-3 ml-2" />
				)}
			</span>
		</Link>
	);

	if (!copy) return linkEl;

	const handleCopy = (e: React.MouseEvent) => {
		e.preventDefault();
		navigator.clipboard.writeText(copyValue ?? label);
	};

	return (
		<div className={`flex items-center gap-2 ${className ?? "justify-end"}`}>
			{linkEl}
			<span className="text-card-input-max hover:text-card-input-hover cursor-pointer" onClick={handleCopy}>
				<FontAwesomeIcon icon={faCopy} className="w-3" />
			</span>
		</div>
	);
}

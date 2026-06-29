import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface Props {
	value: string;
	label?: string;
	className?: string;
}

export default function AppCopy({ value, label, className }: Props) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(value);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className={`flex items-center gap-2 cursor-pointer group ${className ?? ""}`} onClick={handleCopy}>
			<span className="text-card-input-max group-hover:text-card-input-hover transition-colors">{label ?? value}</span>
			<FontAwesomeIcon
				icon={copied ? faCheck : faCopy}
				className={`w-3 transition-colors ${copied ? "text-green-500" : "text-card-input-max group-hover:text-card-input-hover"}`}
			/>
		</div>
	);
}

import { faArrowUpRightFromSquare, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Address, Hash, zeroAddress } from "viem";
import { shortenAddress } from "../utils/format";
import { useContractUrl, useTxUrl } from "../hooks/useContractUrl";

interface Props {
	address: Address;
	label?: string;
	showCopy?: boolean;
	showLink?: boolean;
	className?: string;
}

export default function AddressLabel({ address, label, showCopy, showLink, className }: Props) {
	const link = useContractUrl(address || zeroAddress);

	const handleCopy = (e: React.MouseEvent) => {
		e.preventDefault();
		navigator.clipboard.writeText(address);
	};

	const openExplorer = (e: React.MouseEvent) => {
		e.preventDefault();
		window.open(link, "_blank");
	};

	return (
		<div className={`flex items-center gap-2 ${className ?? ""}`}>
			<span
				className={showLink ? "text-card-input-max hover:text-card-input-hover cursor-pointer" : ""}
				onClick={showLink ? openExplorer : undefined}
			>
				{label ?? shortenAddress(address)}
				{showLink && <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />}
			</span>
			{showCopy && (
				<span
					className="text-card-input-max hover:text-card-input-hover cursor-pointer"
					onClick={handleCopy}
				>
					<FontAwesomeIcon icon={faCopy} className="w-3" />
				</span>
			)}
		</div>
	);
}

export function AddressLabelSimple({ address, label, showLink, className }: Props) {
	const link = useContractUrl(address || zeroAddress);

	const openExplorer = (e: React.MouseEvent) => {
		e.preventDefault();
		window.open(link, "_blank");
	};

	return (
		<div className={className}>
			<span
				className={showLink ? "text-card-input-max hover:text-card-input-hover cursor-pointer" : ""}
				onClick={showLink ? openExplorer : undefined}
			>
				{label ?? shortenAddress(address)}
				{showLink && <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />}
			</span>
		</div>
	);
}

type TxLabelSimpleProps = {
	label: string;
	tx: Hash;
	showLink?: boolean;
	className?: string;
};

export function TxLabelSimple({ label, tx, showLink, className }: TxLabelSimpleProps) {
	const link = useTxUrl(tx);

	const openExplorer = (e: React.MouseEvent) => {
		e.preventDefault();
		window.open(link, "_blank");
	};

	return (
		<div className={className}>
			<span
				className={showLink ? "text-card-input-max hover:text-card-input-hover cursor-pointer" : ""}
				onClick={showLink ? openExplorer : undefined}
			>
				{label}
				{showLink && <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2" />}
			</span>
		</div>
	);
}

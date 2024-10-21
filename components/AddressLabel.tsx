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

export default function AddressLabel({ address, label, showCopy, showLink }: Props) {
	const link = useContractUrl(address || zeroAddress);

	const content = () => {
		return (
			<>
				{
					<div className={showLink ? "cursor-pointer" : ""} onClick={(e) => (showLink ? openExplorer(e) : undefined)}>
						{label ?? shortenAddress(address)}
					</div>
				}
				{showCopy && <FontAwesomeIcon icon={faCopy} className="w-3 ml-2 cursor-pointer" onClick={handleCopy} />}
				{showLink && <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2 cursor-pointer" onClick={openExplorer} />}
			</>
		);
	};

	const handleCopy = (e: any) => {
		e.preventDefault();
		navigator.clipboard.writeText(address);
	};

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(link, "_blank");
	};

	return (
		<>
			<div className="flex items-center">{content()}</div>
		</>
	);
}

export function AddressLabelSimple({ address, label, showLink, className }: Props) {
	const link = useContractUrl(address || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(link, "_blank");
	};

	return (
		<div className={className}>
			<span className={showLink ? "cursor-pointer" : ""} onClick={(e) => (showLink ? openExplorer(e) : undefined)}>
				{label ?? shortenAddress(address)}
			</span>
			{showLink && (
				<span>
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2 my-auto cursor-pointer" onClick={openExplorer} />
				</span>
			)}
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

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(link, "_blank");
	};

	return (
		<div className={className}>
			<span className={showLink ? "cursor-pointer" : ""} onClick={(e) => (showLink ? openExplorer(e) : undefined)}>
				{label}
			</span>
			{showLink && (
				<span>
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2 my-auto cursor-pointer" onClick={openExplorer} />
				</span>
			)}
		</div>
	);
}

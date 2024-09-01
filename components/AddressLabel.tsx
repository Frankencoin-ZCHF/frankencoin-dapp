import { faArrowUpRightFromSquare, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Address, zeroAddress } from "viem";
import { shortenAddress } from "../utils/format";
import { useContractUrl } from "../hooks/useContractUrl";
import Link from "next/link";

interface Props {
	address: Address;
	showCopy?: boolean;
	showLink?: boolean;
}

export default function AddressLabel({ address, showCopy, showLink }: Props) {
	const link = useContractUrl(address || zeroAddress);

	const content = () => {
		return (
			<>
				{
					<div className={showLink ? "cursor-pointer" : ""} onClick={(e) => (showLink ? openExplorer(e) : undefined)}>
						{shortenAddress(address)}
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

export function AddressLabelSimple({ address, showLink }: Props) {
	const link = useContractUrl(address || zeroAddress);

	const openExplorer = (e: any) => {
		e.preventDefault();
		window.open(link, "_blank");
	};

	return (
		<div className="">
			<span className={showLink ? "cursor-pointer" : ""} onClick={(e) => (showLink ? openExplorer(e) : undefined)}>
				{shortenAddress(address)}
			</span>
			{showLink && (
				<span>
					<FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 ml-2 my-auto cursor-pointer" onClick={openExplorer} />
				</span>
			)}
		</div>
	);
}

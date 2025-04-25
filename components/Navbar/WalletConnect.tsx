import { getCarryOnQueryParams, shortenAddress, toQueryString } from "@utils";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useTranslation } from "next-i18next";
import Button from "@components/Button";
import { useRouter } from "next/router";

const ConnectButton = () => {
	const Web3Modal = useWeb3Modal();
	const { isDisconnected, address } = useAccount();
	const { t } = useTranslation();

	return (
		<>
			{isDisconnected || !address ? (
				<Button className="!py-0.5 !px-0 rounded-full" onClick={() => Web3Modal.open()}>
					<span className="px-3 xs:px-8">
						{t("common.connect_wallet")}
					</span>
				</Button>
			) : (
				<button
					onClick={() => Web3Modal.open()}
					className="py-0.5 pl-1 pr-2 bg-layout-primary rounded-full border border-menu-wallet-addressborder justify-center items-center gap-2 flex"
				>
					<div className="w-6 h-6 rounded-full flex justify-center items-center">
						<img src="/icons/wallet-icon.svg" alt="Logo" width={24} height={24} />
					</div>
					<div className="text-menu-active-text text-base font-medium leading-tight">{address && shortenAddress(address)}</div>
				</button>
			)}
		</>
	);
};

export default function WalletConnect() {
	const { t } = useTranslation();
	const router = useRouter();
	const carryOnQueryParams = toQueryString(getCarryOnQueryParams(router));

	return (
		<>
			<div className="md:hidden">
				<ConnectButton />
			</div>
			<div className="h-9 pl-2 pr-0.5 bg-menu-wallet-bg rounded-full border border-menu-wallet-border justify-start items-center gap-4 hidden md:inline-flex">
				<Link href={`/referrals${carryOnQueryParams}`} className="justify-start items-center gap-2 flex !hover:text-button-text-hover-text group">
					<div className="min-w-6 h-6 flex justify-center items-center bg-gradient-to-br to-[#272b37] from-[#5a637f] rounded-full">
						<img src="/icons/chest_white.svg" alt="Logo" width={16} height={16} />
					</div>
					<div className="text-menu-active-text text-base font-extrabold leading-tight whitespace-nowrap group-hover:text-button-text-hover-text">
						{t("common.navbar.my_referrals")}
					</div>
				</Link>
				<div className="flex items-center gap-2">
					<ConnectButton />
				</div>
			</div>
		</>
	);
}

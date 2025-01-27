import { shortenAddress } from "@utils";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import Link from "next/link";
import { useAccount } from "wagmi";

export default function WalletConnect() {
	const Web3Modal = useWeb3Modal();
	const { isDisconnected, address } = useAccount();

	if (isDisconnected) {
		return (
			<div className="flex items-center gap-4 py-1">
				<div
					className="bg-layout-secondary text-text-secondary h-8 md:h-10 flex justify-center items-center rounded-3xl px-4 font-semibold"
					onClick={() => Web3Modal.open()}
				>
					Connect Wallet
				</div>
			</div>
		);
	} else {
		return (
			<>
				<div className="sm:hidden">
					<button
						onClick={() => Web3Modal.open()}
						className="py-0.5 pl-1 pr-2 bg-layout-primary rounded-full border border-menu-wallet-addressborder justify-center items-center gap-2 flex"
					>
						<div className="w-6 h-6 rounded-full flex justify-center items-center">
							<img src="/icons/wallet-icon.svg" alt="Logo" width={24} height={24} />
						</div>
						<div className="text-menu-active-text text-base font-medium leading-tight">
							{address && shortenAddress(address)}
						</div>
					</button>
				</div>
				<div className="h-9 pl-2 pr-0.5 bg-menu-wallet-bg rounded-full border border-menu-wallet-border justify-start items-center gap-4 hidden sm:flex">
					<Link href="/referrals" className="justify-start items-center gap-2 flex">
						<div className="w-6 h-6 flex justify-center items-center bg-gradient-to-br to-[#272b37] from-[#5a637f] rounded-full">
							<img src="/icons/chest_white.svg" alt="Logo" width={16} height={16} />
						</div>
						<div className="text-menu-active-text text-base font-extrabold leading-tight">My Referrals</div>
					</Link>
					<button
						onClick={() => Web3Modal.open()}
						className="py-0.5 pl-1 pr-2 bg-layout-primary rounded-full border border-menu-wallet-addressborder justify-center items-center gap-2 flex"
					>
						<div className="w-6 h-6 rounded-full flex justify-center items-center">
							<img src="/icons/wallet-icon.svg" alt="Logo" width={24} height={24} />
						</div>
						<div className="text-menu-active-text text-base font-medium leading-tight">
							{address && shortenAddress(address)}
						</div>
					</button>
				</div>
			</>
		);
	}
}

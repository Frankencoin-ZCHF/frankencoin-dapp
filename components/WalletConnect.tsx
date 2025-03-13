import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";

export default function WalletConnect() {
	const AppKit = useAppKit();
	const { isConnected } = useAccount();

	if (!isConnected) {
		return (
			<div className="flex items-center gap-4 py-1">
				<div
					className="bg-card-body-secondary text-menu-back h-8 md:h-10 flex justify-center cursor-pointer items-center rounded-3xl px-4 font-semibold hover:bg-button-hover"
					onClick={() => AppKit.open()}
				>
					Connect Wallet
				</div>
			</div>
		);
	} else {
		return (
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2 font-bold">{<appkit-button balance="hide" />}</div>
			</div>
		);
	}
}

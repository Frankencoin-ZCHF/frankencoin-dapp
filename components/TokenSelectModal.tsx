import TokenLogo from "@components/TokenLogo";
import { Modal } from "flowbite-react";
import { formatUnits } from "viem";

interface TokenOption {
	symbol: string;
	name: string;
	balanceOf: bigint;
	decimals: number;
}

type TokenSelectModalProps<T extends TokenOption> = {
	title: string;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	options: T[];
	onTokenSelect: (option: T, index: number, options: T[]) => void;
};

export function TokenSelectModal<T extends TokenOption>({ title, isOpen, setIsOpen, options, onTokenSelect }: TokenSelectModalProps<T>) {

	const handleTokenSelect = (option: T, index: number, options: T[]) => {
		onTokenSelect(option, index, options);
		setIsOpen(false);
	};

	return (
		<Modal
			show={isOpen}
			onClose={() => setIsOpen(false)}
			size="md"
			theme={{
				root: {
					base: "fixed inset-x-0 top-0 z-50 h-screen overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
				},
				content: {
					base: "relative max-h-[80%] w-full md:max-h-[80%]",
					inner: "relative flex h-full flex-col rounded-lg bg-white shadow dark:bg-gray-700",
				},
			}}
		>
			<Modal.Header
				theme={{
					base: "flex items-center justify-between rounded-t px-6 pt-2 pb-0",
					title: "text-lg font-extrabold leading-tight align-middle",
					close: {
						base: "p-1.5 pr-0 ml-auto inline-flex items-center rounded-lg bg-transparent",
						icon: "h-6 w-6",
					},
				}}
			>
				<div className="text-lg font-extrabold leading-tight align-middle">{title}</div>
			</Modal.Header>
			<Modal.Body theme={{ base: "flex flex-col px-3 py-2 overflow-y-auto no-scrollbar" }}>
				<div className="h-full">
					{options.length > 0 && options.map((option, i, optList) => (
						<button
							key={`${option.symbol}-${i}`}
							className="self-stretch py-3 px-3 flex flex-row justify-start items-center w-full hover:bg-card-content-secondary rounded-lg"
							onClick={() => handleTokenSelect(option, i, optList)}
						>
							<span className="pr-3 self-center">
								<TokenLogo currency={option.symbol} size={8} />
							</span>
							<div className="flex flex-col justify-start items-start grow max-h-10">
								<span className="text-base leading-tight font-extrabold">{option.symbol.toUpperCase()}</span>
								<span className="text-base leading-tight text-text-muted">{option.name}</span>
							</div>
							<div className="flex flex-col justify-end items-end max-h-10">
								<span className="text-base leading-tight font-extrabold">$16,579.12</span>
								<span className="text-base leading-tight text-text-muted">
									{formatUnits(option.balanceOf ?? 0n, option.decimals)}
								</span>
							</div>
						</button>
					))}
				</div>
			</Modal.Body>
		</Modal>
	);
}

import Button from "@components/Button";
import TokenLogo from "@components/TokenLogo";
import { formatDate, toTimestamp } from "@utils";
import { Modal } from "flowbite-react";

type BorrowingDEUROModalProps = {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	expiration: Date | null | undefined;
	liquidationPrice?: string | null;
	formmatedCollateral: string;
	youGet: string | null | undefined;
};

export function BorrowingDEUROModal({ isOpen, setIsOpen, youGet, formmatedCollateral, expiration, liquidationPrice }: BorrowingDEUROModalProps) {
	return (
		<Modal show={isOpen} onClose={() => setIsOpen(false)} size="md">
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
				<div className="text-lg font-extrabold leading-tight align-middle">You are borrowing dEURO</div>
			</Modal.Header>
			<Modal.Body theme={{ base: "flex flex-col px-3 py-2" }}>
				<div className="h-full flex flex-col gap-2">
					<div className="h-20 px-3 py-4 justify-center items-center gap-3 inline-flex overflow-hidden">
						<div className="justify-center items-center gap-2.5 flex">
							<div className="w-10 h-10 justify-center items-center flex">
								<TokenLogo currency="deuro" size={10} />
							</div>
						</div>
						<div className="text-[28px] font-medium leading-normal">{youGet}</div>
					</div>
					<div className="p-3 bg-white rounded-lg border border-[#dee0e6] flex-col justify-start items-center gap-3 inline-flex overflow-hidden">
						<div className="self-stretch justify-start items-start gap-2.5 inline-flex">
							<div className="grow shrink basis-0 h-5 justify-start items-center gap-2 flex">
								<div className="text-base leading-tight">Your collateral</div>
							</div>
							<div className="flex-col justify-center items-end inline-flex">
								<div className="h-5 text-right text-sm font-extrabold leading-none tracking-tight">
									{formmatedCollateral}
								</div>
								<div className="text-right text-text-icon text-xs font-medium leading-none">€{formmatedCollateral}</div>
							</div>
						</div>
						<div className="self-stretch justify-start items-start inline-flex">
							<div className="grow shrink basis-0 h-5 justify-start items-center gap-2 flex">
								<div className="text-base leading-tight">Liquidation price</div>
							</div>
							<div className="flex-col justify-center items-end inline-flex">
								<div className="h-5 text-right text-sm font-extrabold leading-none tracking-tight">
									€ {liquidationPrice}
								</div>
								<div className="text-right text-text-icon text-xs font-medium leading-none">$0</div>
							</div>
						</div>
						<div className="self-stretch justify-start items-center gap-2.5 inline-flex">
							<div className="grow shrink basis-0 h-5 justify-start items-start gap-2 flex">
								<div className="text-base leading-tight">Expiration date</div>
							</div>
							<div className="h-5 text-right text-sm font-extrabold leading-none tracking-tight">
								{expiration ? formatDate(toTimestamp(expiration)) : "N/A"}
							</div>
						</div>
					</div>
					<Button isLoading={true} className="p-4 text-lg leading-none">
						Confirm in wallet
					</Button>
				</div>
			</Modal.Body>
		</Modal>
	);
}

import TokenLogo from "@components/TokenLogo";
import { Modal } from "flowbite-react";

type TokenSelectModalProps = {
	title: string;
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	children: React.ReactNode;
};

export const TokenModalRowButton = ({
	currency = "$",
	symbol,
	price,
	balance,
	name,
	onClick,
}: {
	currency?: string;
	symbol: string;
	price: string;
	balance: string;
	name: string;
	onClick: () => void;
}) => {
	return (
		<button
			className="self-stretch py-3 px-3 flex flex-row justify-start items-center w-full hover:bg-card-content-secondary rounded-lg"
			onClick={onClick}
		>
			<span className="pr-3 self-center flex-shrink-0">
				<TokenLogo currency={symbol} size={8} />
			</span>
			<div className="flex flex-col self-stretch justify-start items-start max-h-10 min-w-0 w-full">
				<div className="flex flex-row self-stretch justify-between items-start w-full">
					<span className="text-base leading-tight font-extrabold truncate">{symbol}</span>
					<span className="text-base leading-tight font-extrabold ml-2 flex-shrink-0">{currency}{price}</span>
				</div>
				<div className="flex flex-row gap-2 self-stretch justify-between items-center w-full">
					<span className="text-base leading-tight text-text-muted truncate max-w-[60%]">{name}</span>
					<span className="text-base leading-tight text-text-muted flex-shrink-0">{balance}</span>
				</div>
			</div>
		</button>
	);
};

export function TokenSelectModal({ title, isOpen, setIsOpen, children }: TokenSelectModalProps) {
	return (
		<Modal
			show={isOpen}
			dismissible
			onClose={() => setIsOpen(false)}
			size="md"
			theme={{
				root: {
					base: "fixed px-2 md:px-0 inset-x-0 top-0 z-50 h-screen no-scrollbar overflow-y-auto overflow-x-hidden md:inset-0 md:h-full",
				},
				content: {
					base: "relative max-h-[80%] w-full md:max-h-[80%] no-scrollbar overflow-y-auto rounded-xl bg-white shadow dark:bg-gray-700",
					inner: "relative flex h-full flex-col",
				},
			}}
		>
			<Modal.Header
				theme={{
					base: "flex items-center justify-between rounded-t px-6 pt-2 pb-0 sticky top-0 bg-white dark:bg-gray-700 z-10",
					title: "text-lg font-extrabold leading-tight align-middle",
					close: {
						base: "p-1.5 pr-0 ml-auto inline-flex items-center rounded-lg bg-transparent",
						icon: "h-6 w-6",
					},
				}}
			>
				<div className="text-lg font-extrabold leading-tight align-middle">{title}</div>
			</Modal.Header>
			<Modal.Body theme={{ base: "flex flex-col py-2" }}>
				<div className="overflow-y-auto scrollbar-visible px-3 max-h-[70vh]">{children}</div>
			</Modal.Body>
		</Modal>
	);
}

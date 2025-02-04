export const MaxButton = ({ onClick, className }: { onClick: () => void; className?: string }) => {
	return (
		<button
			className={`${className} h-full px-2 py-2.5 bg-button-max-bg rounded-md justify-center items-center gap-2 flex overflow-hidden`}
			onClick={onClick}
			>
			<span className="text-button-max-text text-xs font-extrabold leading-tight">MAX</span>
		</button>
	);
};
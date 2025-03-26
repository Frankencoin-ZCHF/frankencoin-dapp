import { useState } from "react";

export const SvgIconButton = ({ isSelected, onClick, SvgComponent, children }: { isSelected: boolean; onClick: () => void; SvgComponent: React.ComponentType<{color?: string; className?: string}>; children: React.ReactNode }) => {
	const [isHover, setIsHover] = useState(false);
	return (
		<button
			className="px-2 flex flex-row gap-x-1 items-center py-1 group transition-colors duration-200"
			onMouseEnter={() => setIsHover(true)}
			onMouseLeave={() => setIsHover(false)}
			onClick={onClick}
		>
			<SvgComponent color={isSelected ? "#065DC1" : isHover ? "#272B38" : "#8B92A8"} />
			<span
				className={`mt-0.5 ${
					isSelected
						? "text-button-textGroup-primary-text"
						: "text-button-textGroup-secondary-text group-hover:text-button-textGroup-hover-text"
				} text-base font-extrabold leading-tight`}
			>
				{children}
			</span>
		</button>
	);
};

interface GroupButtonsProps {
	buttons: { id: string; label: string }[];
	setActiveButton: (id: string) => void;
	activeButton: string;
}

export const GroupButtons = ({ buttons, setActiveButton, activeButton }: GroupButtonsProps) => {

	return (
		<div className="w-full p-0.5 bg-layout-primary rounded-xl flex justify-start items-center">
			{buttons.map((button) => (
				<button
					key={button.id}
					onClick={() => setActiveButton(button.id)}
					className={`text-sm sm:w-1/3 sm:text-lg rounded-[0.625rem] px-7 py-1.5 whitespace-nowrap transition-colors duration-200 ${
						activeButton === button.id
							? "font-bold bg-button-primary-default-bg text-white"
							: "text-text-muted2 font-medium rounded"
					}`}
				>
					{button.label}
				</button>
			))}
		</div>
	);
};

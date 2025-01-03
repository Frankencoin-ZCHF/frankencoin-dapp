import { Popover } from "flowbite-react";
import { ExpertModeToogle } from "./ExpertModeToogle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

export const GlobalPreferences = () => {
	return (
		<Popover
			aria-labelledby="default-popover"
			content={
				<div className="flex flex-col gap-2 p-3 min-w-[200px] sm:min-w-[250px] md:min-w-[300px]">
					<div className="pb-1 mb-3 border-b border-gray-100">
						<span className="font-bold text-md">Global Preferences</span>
					</div>
					<ExpertModeToogle />
				</div>
			}
		>
			<button
				type="button"
				className="hover:bg-table-row-hover !outline-none font-medium rounded-full p-2.5 text-center inline-flex items-center mr-2"
			>
				<FontAwesomeIcon icon={faGlobe} className="w-6 h-6" />
			</button>
		</Popover>
	);
};

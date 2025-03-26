import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function InputTitle({ children, icon }: { children: React.ReactNode; icon?: IconProp }) {
	return (
		<div className="self-stretch justify-start items-center gap-1.5 inline-flex">
			<div className="text-lg font-extrabold leading-normal">{children}</div>
			{icon && <FontAwesomeIcon icon={icon} className="w-4 h-4 relative overflow-hidden text-text-icon" />}
		</div>
	);
}
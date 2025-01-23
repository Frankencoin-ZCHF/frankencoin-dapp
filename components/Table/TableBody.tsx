import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface Props {
	children: React.ReactElement[] | React.ReactElement;
	isShowMoreAvailable?: boolean;
	onShowMoreClick?: () => void;
}

export default function TableBody({ children }: Props) {
	return (
		<div className="grid grid-cols-1">
			{children}
		</div>
	);
}

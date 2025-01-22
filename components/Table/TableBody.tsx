import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface Props {
	children: React.ReactElement[] | React.ReactElement;
	isShowMoreAvailable?: boolean;
	onShowMoreClick?: () => void;
}

export default function TableBody({ children, isShowMoreAvailable, onShowMoreClick }: Props) {
	return (
		<div className="grid grid-cols-1">
			{children}
			{isShowMoreAvailable && onShowMoreClick && (
				<button
					onClick={onShowMoreClick}
					className="h-12 px-8 py-3 bg-layout-primary hover:bg-table-row-hover rounded-b-lg border-t border-borders-primary flex-col justify-center items-start gap-2.5 inline-flex"
				>
					<div className="self-stretch justify-center items-center inline-flex">
						<div className="justify-start items-center gap-1 flex">
							<div className="text-table-header-active text-base font-black leading-normal tracking-tight">show more</div>
							<div className="justify-start items-center gap-2.5 flex">
								<FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
							</div>
						</div>
					</div>
				</button>
			)}
		</div>
	);
}

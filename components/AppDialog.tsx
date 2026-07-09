import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface Props {
	title: string;
	isOpen: boolean;
	onClose: () => void;
	preventClose?: boolean; // keep the dialog open, e.g. while a transaction is confirming
	children?: React.ReactNode;
}

/**
 * A modal dialog for entering a state change, styled like an AppCard. Closes via the
 * X button, a click on the backdrop, or the Escape key unless preventClose is set.
 */
export default function AppDialog({ title, isOpen, onClose, preventClose, children }: Props) {
	useEffect(() => {
		if (!isOpen) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !preventClose) onClose();
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [isOpen, preventClose, onClose]);

	if (!isOpen || typeof document === "undefined") return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => !preventClose && onClose()} />
			<section className="relative bg-card-body-primary rounded-lg p-4 flex flex-col gap-y-4 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
				<div className="flex items-center">
					<div className="flex-1 text-lg font-bold text-text-primary">{title}</div>
					<button
						className={`text-text-secondary ${preventClose ? "cursor-not-allowed" : "hover:text-text-primary"}`}
						onClick={() => !preventClose && onClose()}
						aria-label="Close"
					>
						<FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
					</button>
				</div>
				{children}
			</section>
		</div>,
		document.body
	);
}

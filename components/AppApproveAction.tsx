import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import AppButton from "./AppButton";

export interface ApprovalStep {
	// symbol of the token to approve, e.g. "cbBTC"
	tokenSymbol: string;
	// true while the allowance is insufficient for the action
	needsApproval: boolean;
	isApproving?: boolean;
	onApprove: () => void;
	// explains why this approval is needed, shown while it is the pending step
	hint?: string;
}

interface Props {
	// label of the follow-up action, e.g. "Borrow ZCHF"
	actionLabel: string;
	// approvals in the order they have to be sent; for a single token the shorthand below can be used instead
	approvals?: ApprovalStep[];
	tokenSymbol?: string;
	needsApproval?: boolean;
	isApproving?: boolean;
	onApprove?: () => void;
	isActing?: boolean;
	// disables all steps, e.g. on input errors
	disabled?: boolean;
	// disables only the action step, on top of `disabled`
	actionDisabled?: boolean;
	className?: string;
	onAction: () => void;
	hint?: string;
}

/**
 * Shows the approval(s) and the action side by side, so users see that
 * approving is only the first of two (or more) transactions.
 */
export default function AppApproveAction({
	actionLabel,
	approvals,
	tokenSymbol,
	needsApproval,
	isApproving,
	onApprove,
	isActing,
	disabled,
	actionDisabled,
	className,
	onAction,
	hint,
}: Props) {
	const steps: ApprovalStep[] =
		approvals ?? [{ tokenSymbol: tokenSymbol ?? "", needsApproval: !!needsApproval, isApproving, onApprove: onApprove ?? (() => {}) }];

	const pendingIndex = steps.findIndex((s) => s.needsApproval);
	const pending = pendingIndex >= 0 ? steps[pendingIndex] : undefined;
	const allApproved = !pending;
	const anyApproving = steps.some((s) => s.isApproving);

	const defaultHint = anyApproving
		? "Waiting for transaction confirmation."
		: pending
		? pending.hint ?? `Approve ${pending.tokenSymbol} first to enable ${actionLabel}.`
		: `Approval done. Click ${actionLabel} to continue.`;

	return (
		<div>
			<div className={`grid gap-3 ${steps.length > 1 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}>
				{steps.map((step, i) =>
					step.needsApproval ? (
						<AppButton
							key={step.tokenSymbol}
							className={className}
							// later approvals wait for the earlier ones
							disabled={disabled || i > pendingIndex}
							isLoading={step.isApproving}
							onClick={step.onApprove}
						>
							{step.isApproving ? `Approving ${step.tokenSymbol}...` : `Approve ${step.tokenSymbol}`}
						</AppButton>
					) : (
						<div
							key={step.tokenSymbol}
							className={`btn py-2 w-full cursor-default border-green-200 bg-green-50 text-green-700 ${className ?? ""}`}
						>
							<FontAwesomeIcon icon={faCheck} />
							{step.tokenSymbol} approved
						</div>
					)
				)}

				<AppButton
					className={className}
					disabled={!allApproved || disabled || actionDisabled}
					isLoading={isActing}
					onClick={onAction}
				>
					{actionLabel}
				</AppButton>
			</div>
			<div className="mt-2 text-center text-sm text-text-secondary">{hint ?? defaultHint}</div>
		</div>
	);
}

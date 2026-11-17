import { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faPeopleGroup, faPlug } from "@fortawesome/free-solid-svg-icons";
import AppHeroSteps, { HeroStepState } from "@components/AppHeroSteps";
import { formatCurrency } from "@utils";
import { useFcsBindingProgress } from "@hooks";

const MIN_HOLDING_DAYS = 90;
const SECONDS_PER_DAY = 86400;

export default function GovernanceFcsMilestoneSteps() {
	const { pct, isBinding, holdingDuration } = useFcsBindingProgress();
	const pctLabel = `${formatCurrency(pct, 0, 2)}%`;

	type MilestoneStep = {
		threshold: number;
		title: string;
		icon: ReactNode;
		achieved: boolean;
		consequence: string; // third person, e.g. "this <consequence>"
		achievedNote?: string; // only shown once the milestone is reached
		goal: string; // infinitive, e.g. "needs X to <goal>"
	};

	const milestones: MilestoneStep[] = [
		{
			threshold: 2,
			title: "2% Veto Power",
			icon: <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5" />,
			achieved: pct >= 2,
			consequence: "unlocks veto power over protocol proposals",
			goal: "unlock veto power over protocol proposals",
		},
		{
			threshold: 50,
			title: "Majority Migrated",
			icon: <FontAwesomeIcon icon={faPeopleGroup} className="w-3.5 h-3.5" />,
			achieved: pct >= 50,
			consequence: "means a majority of FPS governance power has migrated into FCS",
			goal: "mean a majority of FPS governance power has migrated into FCS",
		},
		{
			threshold: 66.67,
			title: "Binding",
			icon: <FontAwesomeIcon icon={faPlug} className="w-3.5 h-3.5" />,
			// isBinding() is the exact on-chain source of truth (>2/3, not a client-side re-derivation of
			// the rounded 66.67% threshold), so it decides "achieved" here rather than the pct comparison.
			achieved: isBinding,
			consequence: "makes FCS binding",
			goal: "make FCS binding",
			achievedNote: " It can shoot the votes of FPS holders who haven't wrapped.",
		},
	];

	let frontierReached = false;
	const steps = milestones.map((m) => {
		let state: HeroStepState;
		if (m.achieved) {
			state = "done";
		} else if (!frontierReached) {
			state = "current";
			frontierReached = true;
		} else {
			state = "upcoming";
		}

		// Binding additionally requires FCS's holding duration (Equity.holdingDuration) to surpass 90 days
		const isBindingStep = m.threshold === 66.67;
		const holdingDays = holdingDuration / SECONDS_PER_DAY;
		const waitDays = Math.max(0, Math.ceil(MIN_HOLDING_DAYS - holdingDays)); // whole days, rounded up

		let description: string;
		if (state === "done") {
			description = `Reached — FCS holds ${pctLabel} of all FPS votes.${m.achievedNote ?? ""}`;
		} else if (state === "current") {
			const needs: string[] = [];
			if (pct < m.threshold) needs.push(`${m.threshold}%`);
			if (isBindingStep && waitDays > 0) needs.push(`to wait ${waitDays} more days`);
			const needsText = needs.length ? ` — needs ${needs.join(" and ")} to ${m.goal}` : "";
			description = `Currently at ${pctLabel}${needsText}.`;
		} else {
			const needs = isBindingStep
				? `${m.threshold}% of all FPS votes and a holding duration of over ${MIN_HOLDING_DAYS} days${
						waitDays > 0 ? ` (${waitDays} more days to wait)` : ""
				  }`
				: `${m.threshold}% of all FPS votes`;
			description = `At ${needs}, this ${m.consequence}.`;
		}

		return { icon: m.icon, title: m.title, description, state };
	});

	return <AppHeroSteps steps={steps} />;
}

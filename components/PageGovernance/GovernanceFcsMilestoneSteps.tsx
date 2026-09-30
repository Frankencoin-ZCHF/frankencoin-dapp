import { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faPeopleGroup, faPlug } from "@fortawesome/free-solid-svg-icons";
import AppHeroSteps, { HeroStepState } from "@components/AppHeroSteps";
import { formatCurrency } from "@utils";
import { useFcsBindingProgress } from "@hooks";

export default function GovernanceFcsMilestoneSteps() {
	const { pct, isBinding } = useFcsBindingProgress();
	const pctLabel = `${formatCurrency(pct, 0, 2)}%`;

	type MilestoneStep = {
		threshold: number;
		title: string;
		icon: ReactNode;
		achieved: boolean;
		consequence: string;
	};

	const milestones: MilestoneStep[] = [
		{
			threshold: 2,
			title: "2% Veto Power",
			icon: <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5" />,
			achieved: pct >= 2,
			consequence: "unlocks veto power over protocol proposals",
		},
		{
			threshold: 50,
			title: "Majority Migrated",
			icon: <FontAwesomeIcon icon={faPeopleGroup} className="w-3.5 h-3.5" />,
			achieved: pct >= 50,
			consequence: "means a majority of FPS governance power has migrated into FCS",
		},
		{
			threshold: 66.67,
			title: "Binding",
			icon: <FontAwesomeIcon icon={faPlug} className="w-3.5 h-3.5" />,
			// isBinding() is the exact on-chain source of truth (>2/3, not a client-side re-derivation of
			// the rounded 66.67% threshold), so it decides "achieved" here rather than the pct comparison.
			achieved: isBinding,
			consequence: "makes FCS binding — it can shoot the votes of FPS holders who haven't wrapped",
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

		const description =
			state === "done"
				? `Reached — FCS holds ${pctLabel} of all FPS votes.`
				: state === "current"
				? `Currently at ${pctLabel} — needs ${m.threshold}% to ${m.consequence}.`
				: `At ${m.threshold}% of all FPS votes, this ${m.consequence}.`;

		return { icon: m.icon, title: m.title, description, state };
	});

	return <AppHeroSteps steps={steps} />;
}

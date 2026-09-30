import React from "react";

export type HeroStepState = "done" | "current" | "upcoming";

interface HeroStep {
	icon: React.ReactNode;
	title: string;
	description: string;
	state?: HeroStepState;
}

interface Props {
	steps: HeroStep[];
	className?: string;
}

const CIRCLE_STYLE: Record<HeroStepState, string> = {
	done: "bg-green-500 text-white",
	current: "bg-amber-500 text-white",
	upcoming: "bg-text-primary text-white",
};

const CARD_STYLE: Record<HeroStepState, string> = {
	done: "border-green-500/40 bg-green-500/5",
	current: "border-amber-500/50 bg-amber-500/5",
	upcoming: "border-card-input-border opacity-70",
};

export default function AppHeroSteps({ steps, className }: Props) {
	return (
		<div className={`grid grid-cols-1 md:grid-cols-${steps.length} gap-4 ${className ?? ""}`}>
			{steps.map((step, i) => {
				const state = step.state ?? "upcoming";
				// A step without any explicit state (e.g. the plain numbered onboarding steps elsewhere)
				// keeps the original static look — only steps that opt into `state` get colored.
				const circleStyle = step.state ? CIRCLE_STYLE[state] : CIRCLE_STYLE.upcoming;
				const cardStyle = step.state ? CARD_STYLE[state] : "border-card-input-border";

				return (
					<div key={i} className={`flex items-start gap-4 rounded-lg p-4 border bg-card-body-primary ${cardStyle}`}>
						<div
							className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${circleStyle}`}
						>
							{step.icon}
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-bold text-text-primary">{step.title}</span>
							<span className="text-sm text-text-secondary">{step.description}</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}

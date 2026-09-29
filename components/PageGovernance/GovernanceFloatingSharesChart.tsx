import { formatUnits } from "viem";
import AppCard from "@components/AppCard";
import AppRingChart from "@components/AppRingChart";
import { formatCurrency } from "@utils";
import { useFcsBindingProgress } from "@hooks";

// Only the FCS share is filled; the rest of each ring stays empty, so both rings read as progress indicators.
// Same blue as the app's links and button hover, visible on light and dark backgrounds.
const FCS_COLOR = "#0F80F0";

export default function GovernanceFloatingSharesChart() {
	const { pct, fpsSupply, fcsFpsBalance } = useFcsBindingProgress();
	const fcsPct = Math.min(100, Math.max(0, pct));
	const directPct = 100 - fcsPct;

	const fcsSupply = parseFloat(formatUnits(fcsFpsBalance, 18));
	const totalSupply = parseFloat(formatUnits(fpsSupply, 18));
	const directSupply = Math.max(0, totalSupply - fcsSupply);

	// FCS first, so its growing share runs clockwise from 12 o'clock
	const categories = ["Frankencoin Shares (FCS)", "Directly held FPS"];
	const categoryColors = [FCS_COLOR, undefined];
	const votes = [fcsPct, directPct];
	const supply = [fcsSupply, directSupply];

	return (
		<AppCard>
			<div className="grid md:grid-cols-2 gap-4">
				<div className="my-auto py-2">
					<AppRingChart
						categories={categories}
						colors={categoryColors}
						rings={[
							{ label: "Supply", values: supply },
							{ label: "Votes", values: votes },
						]}
					/>
				</div>

				<div className="my-auto space-y-1">
					<div className="text-text-primary font-bold mb-2">Migration Progress</div>
					<div className="text-text-secondary text-sm pb-3">
						Tracks the percentage of FPS already wrapped into FCS and their voting power. Votes are lagging behind holdings.
					</div>

					<div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1 items-baseline">
						<div />
						<div className="text-text-secondary text-sm text-right">Supply</div>
						<div className="text-text-secondary text-sm text-right">Votes</div>

						{categories.map((label, idx) => (
							<div key={label} className="contents">
								<div className="text-text-secondary font-semibold">{label}</div>
								<div className="text-text-secondary font-semibold text-right whitespace-nowrap">
									{formatCurrency(supply[idx], 0, 0)} FPS
								</div>
								<div className="text-text-secondary font-semibold text-right whitespace-nowrap">
									{formatCurrency(votes[idx], 0, 2)}%
								</div>
							</div>
						))}

						<div className="text-text-primary font-semibold mt-2">Total</div>
						<div className="text-text-primary font-semibold text-right mt-2">{formatCurrency(totalSupply, 0, 0)} FPS</div>
						<div className="text-text-primary font-semibold text-right mt-2">100%</div>
					</div>
				</div>
			</div>
		</AppCard>
	);
}

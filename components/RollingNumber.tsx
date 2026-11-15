import { useEffect, useState } from "react";

const CELL = 1.15; // cell height in em, a bit taller than the glyphs so nothing gets clipped
const DURATION_MS = 300;
const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);

interface Props {
	value: string;
	className?: string;
	flipDigits?: number; // number of trailing digits that change too fast to roll, they flip in place instead
}

/**
 * Renders a number string with odometer-style digits that roll upwards when they change.
 * Non-digit characters (separators, signs) are rendered as static cells.
 */
export default function RollingNumber({ value, className, flipDigits = 0 }: Props) {
	const chars = value.split("");
	let digitFromRight = chars.filter((c) => /\d/.test(c)).length;

	return (
		<span className={`inline-flex items-end tabular-nums ${className ?? ""}`}>
			<span className="sr-only">{value}</span>
			{chars.map((c, i) => {
				// keyed from the right, so existing columns keep their state when the number gains a digit
				const key = chars.length - i;
				if (!/\d/.test(c)) {
					return (
						<span
							key={key}
							aria-hidden
							className="inline-block whitespace-pre"
							style={{ height: `${CELL}em`, lineHeight: `${CELL}em` }}
						>
							{c}
						</span>
					);
				}
				digitFromRight--;
				return <RollingDigit key={key} digit={Number(c)} animate={digitFromRight >= flipDigits} />;
			})}
		</span>
	);
}

function RollingDigit({ digit, animate }: { digit: number; animate: boolean }) {
	// position on a strip of three 0-9 cycles; rolling always moves forward, wrapping 9 -> 0 into the next cycle
	const [pos, setPos] = useState(digit);
	const [instant, setInstant] = useState(false);

	useEffect(() => {
		if (!animate) {
			setInstant(true);
			setPos(digit);
			return;
		}
		setPos((p) => {
			const current = p >= 20 ? p - 10 : p; // safety net if a roll back into the first cycle was missed
			if (current % 10 == digit) return current;
			const target = current - (current % 10) + digit;
			return target > current ? target : target + 10;
		});
	}, [digit, animate]);

	// once a roll into a later cycle has finished, jump back to the first cycle without animation
	const onTransitionEnd = () => {
		if (pos < 10) return;
		setInstant(true);
		setPos(pos % 10);
	};

	useEffect(() => {
		if (!instant || !animate) return;
		const id = requestAnimationFrame(() => setInstant(false));
		return () => cancelAnimationFrame(id);
	}, [instant, animate]);

	return (
		<span aria-hidden className="inline-block overflow-hidden" style={{ height: `${CELL}em`, lineHeight: `${CELL}em` }}>
			<span
				className={`flex flex-col ${instant ? "" : "transition-transform ease-out motion-reduce:transition-none"}`}
				style={{ transform: `translateY(-${pos * CELL}em)`, transitionDuration: instant ? "0ms" : `${DURATION_MS}ms` }}
				onTransitionEnd={onTransitionEnd}
			>
				{STRIP.map((d, i) => (
					<span key={i} style={{ height: `${CELL}em` }}>
						{d}
					</span>
				))}
			</span>
		</span>
	);
}

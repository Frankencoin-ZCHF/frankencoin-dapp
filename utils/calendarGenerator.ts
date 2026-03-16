import { PositionQuery } from "@frankencoin/api";
import { formatUnits } from "viem";

/**
 * Generates an ICS calendar file for position expiration alerts
 */
export function generateExpirationCalendar(positions: PositionQuery[], ownerAddress: string): string {
	const now = new Date();
	const timestamp = now
		.toISOString()
		.replace(/[:-]/g, "")
		.replace(/\.\d{3}/, "");

	let icsContent = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Frankencoin//Position Alerts//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"X-WR-CALNAME:Frankencoin Position Alerts",
		"X-WR-CALDESC:Expiration alerts for your Frankencoin positions",
	];

	// Filter out closed/denied positions and add events for each position
	const activePositions = positions.filter((p) => !p.closed && !p.denied);

	activePositions.forEach((position) => {
		// Create alert events at different intervals before expiration
		const alertIntervals = [
			{ days: 7, title: "Position expires in 7 days" },
			{ days: 1, title: "Position expires in 24 hours" },
			{ hours: 1, title: "Position expires in 1 hour" },
		];

		alertIntervals.forEach((interval) => {
			const expirationDate = new Date(position.expiration * 1000);
			let alertDate: Date;

			if (interval.days) {
				alertDate = new Date(expirationDate.getTime() - interval.days * 24 * 60 * 60 * 1000);
			} else if (interval.hours) {
				alertDate = new Date(expirationDate.getTime() - interval.hours * 60 * 60 * 1000);
			} else {
				return; // Skip invalid intervals
			}

			// Only create alerts for future dates
			if (alertDate > now) {
				const eventId = `${position.position}-${interval.days || 0}d-${interval.hours || 0}h-${timestamp}`;
				const collateralAmount = formatUnits(BigInt(position.collateralBalance), position.collateralDecimals);

				// Calculate Debt and Reserve amounts
				const totalMinted = parseFloat(formatUnits(BigInt(position.minted), 18)); // ZCHF has 18 decimals
				const reserveContribution = position.reserveContribution / 1000000; // Convert from PPM
				const debt = Math.round(totalMinted * (1 - reserveContribution));
				const reserve = Math.round(totalMinted * reserveContribution);

				icsContent.push(
					"BEGIN:VEVENT",
					`UID:${eventId}@frankencoin.com`,
					`DTSTAMP:${timestamp}`,
					`DTSTART:${formatDateForICS(alertDate)}`,
					`DTEND:${formatDateForICS(new Date(alertDate.getTime() + 60 * 60 * 1000))}`, // 1 hour duration
					`SUMMARY:🔔 Frankencoin: ${interval.title}`,
					`DESCRIPTION:Your Frankencoin position is expiring soon!\\n\\n` +
						`Position: ${position.position}\\n` +
						`Collateral: ${collateralAmount} ${position.collateralSymbol}\\n` +
						`Debt: ${debt} ZCHF\\n` +
						`Reserve: ${reserve} ZCHF\\n` +
						`Expiration: ${expirationDate.toLocaleString()}\\n\\n` +
						`Visit: https://app.frankencoin.com/mypositions/${position.position}`,
					"BEGIN:VALARM",
					"ACTION:DISPLAY",
					`DESCRIPTION:${interval.title}`,
					"TRIGGER:-PT15M", // 15 minutes before the alert time
					"END:VALARM",
					"END:VEVENT"
				);
			}
		});
	});

	icsContent.push("END:VCALENDAR");

	return icsContent.join("\r\n");
}

/**
 * Formats a Date object to ICS date-time format (YYYYMMDDTHHMMSSZ)
 */
function formatDateForICS(date: Date): string {
	return date
		.toISOString()
		.replace(/[:-]/g, "")
		.replace(/\.\d{3}/, "");
}

/**
 * Downloads the calendar file
 */
export function downloadCalendarFile(content: string, filename: string = "frankencoin-position-alerts.ics") {
	const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

export type AlertInterval = "7d" | "24h";

/**
 * Generates a Google Calendar URL for a single position's expiration alert
 * @param position - The position to create an alert for
 * @param interval - Alert interval: "7d" for 7 days before, "24h" for 24 hours before
 */
export function generateGoogleCalendarUrl(position: PositionQuery, interval: AlertInterval = "7d"): string {
	const expirationDate = new Date(position.expiration * 1000);

	// Calculate alert date based on interval
	const offsetMs = interval === "7d" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
	const alertDate = new Date(expirationDate.getTime() - offsetMs);
	const endDate = new Date(alertDate.getTime() + 60 * 60 * 1000); // 1 hour duration

	const collateralAmount = formatUnits(BigInt(position.collateralBalance), position.collateralDecimals);
	const totalMinted = parseFloat(formatUnits(BigInt(position.minted), 18));
	const reserveContribution = position.reserveContribution / 1000000;
	const debt = Math.round(totalMinted * (1 - reserveContribution));
	const reserve = Math.round(totalMinted * reserveContribution);

	const intervalLabel = interval === "7d" ? "7 days" : "24 hours";
	const title = `🔔 Frankencoin: Position expires in ${intervalLabel}`;
	const description =
		`Your Frankencoin position is expiring soon!\n\n` +
		`Position: ${position.position}\n` +
		`Collateral: ${collateralAmount} ${position.collateralSymbol}\n` +
		`Debt: ${debt} ZCHF\n` +
		`Reserve: ${reserve} ZCHF\n` +
		`Expiration: ${expirationDate.toLocaleString()}\n\n` +
		`Visit: https://app.frankencoin.com/mypositions/${position.position}`;

	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: title,
		dates: `${formatDateForGoogleCalendar(alertDate)}/${formatDateForGoogleCalendar(endDate)}`,
		details: description,
		sf: "true",
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates Google Calendar URLs for multiple positions
 * Returns an array of URLs with both 7-day and 24-hour warnings per position
 */
export function generateGoogleCalendarUrls(
	positions: PositionQuery[]
): { position: PositionQuery; interval: AlertInterval; url: string }[] {
	const now = new Date();
	const activePositions = positions.filter((p) => !p.closed && !p.denied);
	const intervals: AlertInterval[] = ["7d", "24h"];

	const results: { position: PositionQuery; interval: AlertInterval; url: string }[] = [];

	activePositions.forEach((position) => {
		const expirationDate = new Date(position.expiration * 1000);

		intervals.forEach((interval) => {
			const offsetMs = interval === "7d" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
			const alertDate = new Date(expirationDate.getTime() - offsetMs);

			// Only include if alert date is in the future
			if (alertDate > now) {
				results.push({
					position,
					interval,
					url: generateGoogleCalendarUrl(position, interval),
				});
			}
		});
	});

	return results;
}

/**
 * Formats a Date object for Google Calendar URL (YYYYMMDDTHHMMSSZ)
 */
function formatDateForGoogleCalendar(date: Date): string {
	return date
		.toISOString()
		.replace(/[:-]/g, "")
		.replace(/\.\d{3}/, "");
}

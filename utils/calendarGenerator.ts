import { PositionQuery } from "@frankencoin/api";
import { formatUnits } from "viem";

/**
 * Generates an ICS calendar file for position expiration alerts
 */
export function generateExpirationCalendar(positions: PositionQuery[], ownerAddress: string): string {
	const now = new Date();
	const timestamp = now.toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");

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
						`Expiration: ${expirationDate.toLocaleString()}\\n\\n` +
						`Visit: https://app.frankencoin.com/mypositions`,
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
	return date.toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");
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
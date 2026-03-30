import { PositionQuery } from "@frankencoin/api";
import { formatUnits } from "viem";

/**
 * Generates an ICS calendar file for position expiration alerts.
 * Creates one event per position at the exact expiration time,
 * with VALARM reminders at 7 days and 24 hours before.
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

	const activePositions = positions.filter((p) => !p.closed && !p.denied);

	activePositions.forEach((position) => {
		const expirationDate = new Date(position.expiration * 1000);

		if (expirationDate <= now) return;

		const collateralAmount = formatUnits(BigInt(position.collateralBalance), position.collateralDecimals);
		const totalMinted = parseFloat(formatUnits(BigInt(position.minted), 18));
		const reserveContribution = position.reserveContribution / 1000000;
		const debt = Math.round(totalMinted * (1 - reserveContribution));
		const reserve = Math.round(totalMinted * reserveContribution);

		icsContent.push(
			"BEGIN:VEVENT",
			`UID:${position.position}-expiry-${timestamp}@frankencoin.com`,
			`DTSTAMP:${timestamp}`,
			`DTSTART:${formatDateForICS(expirationDate)}`,
			`DTEND:${formatDateForICS(new Date(expirationDate.getTime() + 60 * 60 * 1000))}`,
			`SUMMARY:🔔 ${position.collateralSymbol} position expires`,
			`DESCRIPTION:Expiration of a ${position.collateralSymbol} position.\\n\\n` +
				`Position: ${position.position}\\n` +
				`Collateral: ${collateralAmount} ${position.collateralSymbol}\\n` +
				`Debt: ${debt} ZCHF\\n` +
				`Reserve: ${reserve} ZCHF\\n` +
				`Expiration: ${expirationDate.toLocaleString()}\\n\\n` +
				`Visit: https://app.frankencoin.com/mypositions/${position.position}`,
			// 7-day reminder
			"BEGIN:VALARM",
			"ACTION:DISPLAY",
			"DESCRIPTION:Position expires in 7 days",
			"TRIGGER:-P7D",
			"END:VALARM",
			// 24-hour reminder
			"BEGIN:VALARM",
			"ACTION:DISPLAY",
			"DESCRIPTION:Position expires in 24 hours",
			"TRIGGER:-PT24H",
			"END:VALARM",
			"END:VEVENT"
		);
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

/**
 * Generates a Google Calendar URL for a position expiration event.
 * The event is placed at the exact expiration time.
 */
export function generateGoogleCalendarUrl(position: PositionQuery): string {
	const expirationDate = new Date(position.expiration * 1000);
	const endDate = new Date(expirationDate.getTime() + 60 * 60 * 1000); // 1 hour duration

	const collateralAmount = formatUnits(BigInt(position.collateralBalance), position.collateralDecimals);
	const totalMinted = parseFloat(formatUnits(BigInt(position.minted), 18));
	const reserveContribution = position.reserveContribution / 1000000;
	const debt = Math.round(totalMinted * (1 - reserveContribution));
	const reserve = Math.round(totalMinted * reserveContribution);

	const details =
		`One of your Frankencoin positions is expiring. Please renew or close it before it is too late.\n\n` +
		`Collateral: ${collateralAmount} ${position.collateralSymbol}\n` +
		`Debt: ${debt} ZCHF\n` +
		`Reserve: ${reserve} ZCHF\n\n` +
		`Manage position: https://app.frankencoin.com/mypositions/${position.position}`;

	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: `🔔 ${position.collateralSymbol} position expires`,
		dates: `${formatDateForICS(expirationDate)}/${formatDateForICS(endDate)}`,
		details: `One of your <a href="https://app.frankencoin.com/mypositions/${position.position}"> ${position.collateralSymbol} positions</a> in the Frankencoin system expires.`,
	});

	return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

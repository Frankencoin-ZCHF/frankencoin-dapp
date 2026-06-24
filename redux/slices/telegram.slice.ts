const TELEGRAM_BOT_BASE = `https://t.me/${process.env.NEXT_PUBLIC_BOT_NAME ?? "FrankencoinApiBot"}`;

export function getBotUrl(address?: string): string {
	if (address) return `${TELEGRAM_BOT_BASE}?start=${address}`;
	return TELEGRAM_BOT_BASE;
}

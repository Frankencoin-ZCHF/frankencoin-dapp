export function fmt(n: number | undefined | null, d = 1): string {
	if (n === undefined || n === null || !isFinite(n)) return "–";
	const a = Math.abs(n);
	if (a >= 1e9) return (n / 1e9).toFixed(d) + "B";
	if (a >= 1e6) return (n / 1e6).toFixed(d) + "M";
	if (a >= 1e4) return (n / 1e3).toFixed(d) + "k";
	if (a >= 100) return n.toFixed(0);
	if (a >= 1) return n.toFixed(2);
	return n === 0 ? "0" : n.toFixed(3);
}

export const pct = (v: number, d = 1) => (v * 100).toFixed(d) + "%";
export const dateStr = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
export const shortAddr = (a: string) => (a && a.length > 12 ? a.slice(0, 6) + "…" + a.slice(-4) : a);

export function rgba(hex: string, a: number): string {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

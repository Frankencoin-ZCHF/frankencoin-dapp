export const abs = (n: bigint) => (n < 0n ? -n : n);

export const min = (a: bigint, b: bigint) => (a > b ? b : a);

export function bigIntMin(...values: bigint[]): bigint {
	return values.reduce((min, current) => (current < min ? current : min));
}

export function bigIntMax(...values: bigint[]): bigint {
	return values.reduce((max, current) => (current > max ? current : max));
}

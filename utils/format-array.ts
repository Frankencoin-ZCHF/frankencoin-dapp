// returns unique values from given array
export function uniqueValues<T>(value: T, index: number, array: T[]): boolean {
	return array.indexOf(value) === index;
}

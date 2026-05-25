export type XerberusEntityType = "pool" | "protocol" | "organisation" | "asset";

export type XerberusRating = {
	type: XerberusEntityType;
	id: string;
	name: string;
	score: number | null;
	platform: string | null;
	address: string | null;
};

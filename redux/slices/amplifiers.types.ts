import { AmplifierQuery } from "@frankencoin/api";

export type AmplifiersState = {
	error: string | null;
	loaded: boolean;
	list: AmplifierQuery[];
};

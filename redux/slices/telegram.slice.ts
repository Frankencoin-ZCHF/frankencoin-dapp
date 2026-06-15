import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";
import { RootState } from "../redux.store";

// -------------------------------------------------------------------------------

const TELEGRAM_BOT_BASE = "https://t.me/samclassixbot";
const STORAGE_KEY = "telegram_link_jwt";

export type SessionContext = "dm" | "group";

export function getLoginUrl(jti: string, context: SessionContext): string {
	const param = context === "dm" ? "start" : "startgroup";
	return `${TELEGRAM_BOT_BASE}?${param}=login_${jti}`;
}

// -------------------------------------------------------------------------------

export type TelegramAlertType =
	| "weeklyInfo"
	| "newPosition"
	| "positionExpiry"
	| "challenge"
	| "newMinter"
	| "mintingUpdates"
	| "priceAlerts"
	| "equityEvents"
	| "ccipProposal"
	| "savingsRate"
	| "mintingRate"
	| "position"
	| "owner"
	| "collateral";

export type TelegramAlert = {
	id: string;
	type: TelegramAlertType;
	address: string;
	createdAt: string;
};

export type TelegramState = {
	loaded: boolean;
	linked: boolean;
	jwt: string | null;
	jti: string | null;
	alerts: TelegramAlert[];
};

// -------------------------------------------------------------------------------

function decodeJti(token: string): string | null {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.jti ?? null;
	} catch {
		return null;
	}
}

function authHeaders(jwt: string) {
	return { Authorization: `Bearer ${jwt}` };
}

// -------------------------------------------------------------------------------

const initialState: TelegramState = {
	loaded: false,
	linked: false,
	jwt: null,
	jti: null,
	alerts: [],
};

export const slice = createSlice({
	name: "telegram",
	initialState,
	reducers: {
		setLoaded: (state, action: { payload: boolean }) => {
			state.loaded = action.payload;
		},
		setLinked: (state, action: { payload: boolean }) => {
			state.linked = action.payload;
		},
		setJwt: (state, action: { payload: string | null }) => {
			state.jwt = action.payload;
		},
		setJti: (state, action: { payload: string | null }) => {
			state.jti = action.payload;
		},
		setAlerts: (state, action: { payload: TelegramAlert[] }) => {
			state.alerts = action.payload;
		},
		alertAdded: (state, action: { payload: TelegramAlert }) => {
			if (!state.alerts.find((a) => a.id === action.payload.id)) {
				state.alerts.push(action.payload);
			}
		},
		alertRemoved: (state, action: { payload: string }) => {
			state.alerts = state.alerts.filter((a) => a.id !== action.payload);
		},
	},
});

export const reducer = slice.reducer;

// -------------------------------------------------------------------------------
// Thunks

export const initTelegramAuth = () => async (dispatch: Dispatch) => {
	dispatch(slice.actions.setLoaded(false));
	try {
		let jwt = localStorage.getItem(STORAGE_KEY);

		if (jwt) {
			try {
				const statusRes = await FRANKENCOIN_API_CLIENT.get<{ linked: boolean }>("/auth/token/status", {
					headers: authHeaders(jwt),
				});
				if (statusRes.data.linked) {
					dispatch(slice.actions.setJwt(jwt));
					dispatch(slice.actions.setJti(decodeJti(jwt)));
					dispatch(slice.actions.setLinked(true));
					await dispatch(fetchTelegramAlerts() as any);
					return;
				}
			} catch {
				// token expired or rejected
			}
			localStorage.removeItem(STORAGE_KEY);
			dispatch(slice.actions.setJwt(null));
			dispatch(slice.actions.setJti(null));
			jwt = null;
		}

		const res = await FRANKENCOIN_API_CLIENT.post<{ token: string }>("/auth/token");
		jwt = res.data.token;
		localStorage.setItem(STORAGE_KEY, jwt);
		const jti = decodeJti(jwt);
		dispatch(slice.actions.setJwt(jwt));
		dispatch(slice.actions.setJti(jti));
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		dispatch(slice.actions.setJwt(null));
		dispatch(slice.actions.setJti(null));
	} finally {
		dispatch(slice.actions.setLoaded(true));
	}
};

export const fetchTelegramAlerts = () => async (dispatch: Dispatch, getState: () => RootState) => {
	const jwt = getState().telegram.jwt;
	if (!jwt) return;
	try {
		const res = await FRANKENCOIN_API_CLIENT.get<TelegramAlert[]>("/auth/alerts", { headers: authHeaders(jwt) });
		dispatch(slice.actions.setAlerts(res.data));
	} catch {}
};

export const addTelegramAlert =
	(type: TelegramAlertType, address = "") =>
	async (dispatch: Dispatch, getState: () => RootState) => {
		const jwt = getState().telegram.jwt;
		if (!jwt) return;
		try {
			const res = await FRANKENCOIN_API_CLIENT.post<TelegramAlert>("/auth/alerts", { type, address }, { headers: authHeaders(jwt) });
			dispatch(slice.actions.alertAdded(res.data));
		} catch {}
	};

export const removeTelegramAlert = (id: string) => async (dispatch: Dispatch, getState: () => RootState) => {
	const jwt = getState().telegram.jwt;
	if (!jwt) return;
	try {
		await FRANKENCOIN_API_CLIENT.delete(`/auth/alerts/${id}`, { headers: authHeaders(jwt) });
		dispatch(slice.actions.alertRemoved(id));
	} catch {}
};

export const toggleTelegramAlert =
	(type: TelegramAlertType, address = "") =>
	(dispatch: Dispatch, getState: () => RootState) => {
		const existing = getState().telegram.alerts.find((a) => a.type === type && a.address === address);
		if (existing) {
			dispatch(removeTelegramAlert(existing.id) as any);
		} else {
			dispatch(addTelegramAlert(type, address) as any);
		}
	};

export const clearTelegramSession = () => async (dispatch: Dispatch) => {
	localStorage.removeItem(STORAGE_KEY);
	dispatch(slice.actions.setJwt(null));
	dispatch(slice.actions.setJti(null));
	dispatch(slice.actions.setLinked(false));
	dispatch(slice.actions.setAlerts([]));
	dispatch(slice.actions.setLoaded(false));
	await dispatch(initTelegramAuth() as any);
};

export const testTelegramBot = () => async (_dispatch: Dispatch, getState: () => RootState) => {
	const jwt = getState().telegram.jwt;
	if (!jwt) return false;
	try {
		await FRANKENCOIN_API_CLIENT.post("/auth/test", {}, { headers: authHeaders(jwt) });
		return true;
	} catch {
		return false;
	}
};

export const confirmTelegramLinked = () => async (dispatch: Dispatch, getState: () => RootState) => {
	const jwt = getState().telegram.jwt;
	if (!jwt) return false;
	try {
		const res = await FRANKENCOIN_API_CLIENT.get<{ linked: boolean }>("/auth/token/status", { headers: authHeaders(jwt) });
		if (res.data.linked) {
			dispatch(slice.actions.setLinked(true));
			await dispatch(fetchTelegramAlerts() as any);
			return true;
		}
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		dispatch(slice.actions.setJwt(null));
		dispatch(slice.actions.setJti(null));
	}
	return false;
};

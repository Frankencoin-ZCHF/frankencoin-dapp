import { useSelector } from "react-redux";
import { AlertType } from "@frankencoin/api";
import { normalizeAddress } from "@utils";
import { RootState, store } from "../redux/redux.store";
import {
	toggleTelegramAlert,
	addTelegramAlert,
	removeTelegramAlert,
	fetchTelegramAlerts,
} from "../redux/slices/telegram.slice";

export type AlertPosition = {
	position: string;
	owner: string;
	collateral: string;
};

export function useTelegramAlerts() {
	const { loaded, linked, jwt, jti, alerts } = useSelector((state: RootState) => state.telegram);

	const norm = (addr: string) => addr.toLowerCase();

	// True if the user has the given alert type subscribed (broadcast-style, no address)
	const isEnabled = (type: AlertType, address = "") => alerts.some((a) => a.type === type && norm(a.address) === norm(address));

	// Mirrors getAlertRecipients on the server — true when this user would receive
	// an alert of `alertType` for a given position (has the type AND watches the position).
	const isAlertRecipient = (alertType: AlertType, pos: AlertPosition): boolean => {
		const addr = norm(pos.position);
		const owner = norm(pos.owner);
		const collateral = norm(pos.collateral);

		const hasType = alerts.some((a) => a.type === alertType && a.address === "");
		if (!hasType) return false;

		return alerts.some(
			(a) =>
				(a.type === "allPositions" && a.address === "") ||
				(a.type === "position" && norm(a.address) === addr) ||
				(a.type === "owner" && norm(a.address) === owner) ||
				(a.type === "collateral" && norm(a.address) === collateral)
		);
	};

	const toggle = (type: AlertType, address = "") => store.dispatch(toggleTelegramAlert(type, norm(address)) as any);
	const add = (type: AlertType, address = "") => store.dispatch(addTelegramAlert(type, norm(address)) as any);
	const remove = (id: string) => store.dispatch(removeTelegramAlert(id) as any);
	const refetch = () => store.dispatch(fetchTelegramAlerts() as any);

	return {
		loaded,
		linked,
		jwt,
		jti,
		alerts,
		isEnabled,
		isAlertRecipient,
		toggle,
		add,
		remove,
		refetch,
	};
}

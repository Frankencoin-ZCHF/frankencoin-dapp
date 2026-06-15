import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import LoadingSpin from "@components/LoadingSpin";
import AddressLabel from "@components/AddressLabel";
import { Address } from "viem";
import { FRANKENCOIN_API_CLIENT } from "../../app.config";

const TELEGRAM_BOT_BASE = "https://t.me/FrankencoinApiBot";
const STORAGE_KEY_JWT = "telegram_link_jwt";

type Alert = { id: string; type: string; address: string; createdAt: string };

function decodeJti(token: string): string | null {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.jti ?? null;
	} catch {
		return null;
	}
}

export default function TelegramLoginQR() {
	const [loginUrl, setLoginUrl] = useState<string>("");
	const [linked, setLinked] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(true);
	const [alerts, setAlerts] = useState<Alert[]>([]);
	const jwtRef = useRef<string | null>(null);

	const fetchAlerts = async (jwt: string) => {
		try {
			const res = await FRANKENCOIN_API_CLIENT.get<Alert[]>("/auth/alerts", {
				headers: { Authorization: `Bearer ${jwt}` },
			});
			setAlerts(res.data);
		} catch {}
	};

	const removeAlert = async (id: string) => {
		const jwt = jwtRef.current;
		if (!jwt) return;
		try {
			await FRANKENCOIN_API_CLIENT.delete(`/auth/alerts/${id}`, {
				headers: { Authorization: `Bearer ${jwt}` },
			});
			setAlerts((prev) => prev.filter((a) => a.id !== id));
		} catch {}
	};

	useEffect(() => {
		let poll: ReturnType<typeof setInterval> | null = null;

		const init = async () => {
			setLoading(true);
			try {
				let jwt = localStorage.getItem(STORAGE_KEY_JWT);

				if (!jwt) {
					const res = await FRANKENCOIN_API_CLIENT.post<{ token: string }>("/auth/token");
					jwt = res.data.token;
					localStorage.setItem(STORAGE_KEY_JWT, jwt);
				}

				jwtRef.current = jwt;

				const jti = decodeJti(jwt);
				if (!jti) {
					localStorage.removeItem(STORAGE_KEY_JWT);
					setLoading(false);
					return;
				}

				// Check immediately — returning users skip the QR entirely
				const statusRes = await FRANKENCOIN_API_CLIENT.get<{ linked: boolean }>("/auth/token/status", {
					headers: { Authorization: `Bearer ${jwt}` },
				});

				if (statusRes.data.linked) {
					setLinked(true);
					await fetchAlerts(jwt);
					setLoading(false);
					return;
				}

				setLoginUrl(`${TELEGRAM_BOT_BASE}?start=login_${jti}`);
				setLoading(false);

				poll = setInterval(async () => {
					try {
						const res = await FRANKENCOIN_API_CLIENT.get<{ linked: boolean }>("/auth/token/status", {
							headers: { Authorization: `Bearer ${jwt}` },
						});
						if (res.data.linked) {
							setLinked(true);
							if (poll) clearInterval(poll);
							await fetchAlerts(jwt);
						}
					} catch {
						localStorage.removeItem(STORAGE_KEY_JWT);
						if (poll) clearInterval(poll);
					}
				}, 2000);
			} catch {
				setLoading(false);
			}
		};

		init();
		return () => {
			if (poll) clearInterval(poll);
		};
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center py-6">
				<LoadingSpin />
			</div>
		);
	}

	if (!linked) {
		if (!loginUrl) return null;
		return (
			<div className="flex flex-col items-center gap-3 py-4">
				<div className="text-text-secondary text-sm">Scan to link your Telegram account for personalized alerts.</div>
				<div className="bg-white p-4 rounded-xl">
					<QRCode value={loginUrl} size={180} />
				</div>
				<AppLink label={loginUrl} href={loginUrl} external={true} />
				<div className="text-xs text-text-secondary animate-pulse">Waiting for Telegram link…</div>
			</div>
		);
	}

	const positions = alerts.filter((a) => a.type === "position");
	const owners = alerts.filter((a) => a.type === "owner");
	const collaterals = alerts.filter((a) => a.type === "collateral");

	return (
		<div className="flex flex-col gap-4">
			<AppCard className="flex items-center gap-2 px-4 py-3">
				<span className="text-green-500 font-bold">✅ Telegram Linked</span>
			</AppCard>

			<AppCard className="flex flex-col gap-1 px-4 py-3">
				<div className="font-bold text-sm mb-1">Subscriptions</div>
				<div className="text-text-secondary text-sm">
					Manage broadcast subscriptions via{" "}
					<AppLink label="/subscribe" href={TELEGRAM_BOT_BASE} external={true} /> in the bot.
				</div>
			</AppCard>

			<AlertSection title="Watching Positions" items={positions} onRemove={removeAlert} />
			<AlertSection title="Watching Owners" items={owners} onRemove={removeAlert} />
			<AlertSection title="Watching Collateral" items={collaterals} onRemove={removeAlert} />
		</div>
	);
}

function AlertSection({ title, items, onRemove }: { title: string; items: Alert[]; onRemove: (id: string) => void }) {
	return (
		<AppCard className="flex flex-col gap-2 px-4 py-3">
			<div className="font-bold text-sm">{title}</div>
			{items.length === 0 ? (
				<div className="text-text-secondary text-sm">None</div>
			) : (
				items.map((item) => (
					<div key={item.id} className="flex items-center justify-between">
						<AddressLabel address={item.address as Address} showLink />
						<button
							onClick={() => onRemove(item.id)}
							className="text-xs text-red-400 hover:text-red-600 transition-colors"
						>
							Remove
						</button>
					</div>
				))
			)}
		</AppCard>
	);
}

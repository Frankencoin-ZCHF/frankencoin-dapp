import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import QRCode from "react-qr-code";
import AppCard from "@components/AppCard";
import AppLink from "@components/AppLink";
import LoadingSpin from "@components/LoadingSpin";
import { RootState, store } from "../../redux/redux.store";
import {
	clearTelegramSession,
	confirmTelegramLinked,
	getLoginUrl,
	initTelegramAuth,
	testTelegramBot,
} from "../../redux/slices/telegram.slice";

export function TelegramLinkStatus() {
	const { loaded, linked, jti } = useSelector((state: RootState) => state.telegram);
	const [testState, setTestState] = useState<"idle" | "sending" | "sent" | "error">("idle");
	const loginUrl = jti ? getLoginUrl(jti, "dm") : "";

	useEffect(() => {
		store.dispatch(initTelegramAuth() as any);
	}, []);

	useEffect(() => {
		if (linked || !loaded || !jti) return;
		const poll = setInterval(async () => {
			const resolved = await store.dispatch(confirmTelegramLinked() as any);
			if (resolved) clearInterval(poll);
		}, 2000);
		return () => clearInterval(poll);
	}, [linked, loaded, jti]);

	const handleTest = async () => {
		setTestState("sending");
		const ok = await store.dispatch(testTelegramBot() as any);
		setTestState(ok ? "sent" : "error");
		setTimeout(() => setTestState("idle"), 3000);
	};

	if (!loaded) {
		return (
			<div className="flex justify-center py-6">
				<LoadingSpin />
			</div>
		);
	}

	if (linked) {
		return (
			<AppCard className="flex items-center justify-between px-4 py-3">
				<span className="font-bold">✅ Telegram Linked</span>
				<div className="flex items-center gap-3">
					<button
						onClick={handleTest}
						disabled={testState === "sending"}
						className="text-xs text-text-secondary hover:text-blue-400 transition-colors disabled:opacity-50"
					>
						{testState === "sending"
							? "Sending…"
							: testState === "sent"
							? "✓ Sent"
							: testState === "error"
							? "✗ Failed"
							: "Send Test Message"}
					</button>
					<button
						onClick={() => store.dispatch(clearTelegramSession() as any)}
						className="text-xs text-text-secondary hover:text-red-400 transition-colors"
					>
						Disconnect
					</button>
				</div>
			</AppCard>
		);
	}

	if (!loginUrl) return null;

	return (
		<AppCard className="flex flex-col items-center gap-3 px-4 py-6">
			<div className="bg-white p-4 rounded-xl">
				<QRCode value={loginUrl} size={180} />
			</div>
			<AppLink label="Click and link with Telegram" href={loginUrl} external copy copyValue={loginUrl} />
			<div className="text-xs text-text-secondary animate-pulse">Waiting for Telegram link…</div>
		</AppCard>
	);
}

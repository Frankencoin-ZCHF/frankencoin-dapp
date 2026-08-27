"use client";

import React, { ReactNode } from "react";
import { WAGMI_CONFIG, CONFIG, WAGMI_ADAPTER, WAGMI_METADATA, WAGMI_CHAINS, WAGMI_CHAIN } from "../app.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Config, State, WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { AppKitNetwork } from "@reown/appkit/networks";

const queryClient = new QueryClient();
if (!CONFIG.wagmiId) throw new Error("Project ID is not defined");

const modal = createAppKit({
	adapters: [WAGMI_ADAPTER],
	projectId: CONFIG.wagmiId,
	// @ts-ignore
	networks: WAGMI_CHAINS,
	defaultNetwork: WAGMI_CHAIN as AppKitNetwork,
	metadata: WAGMI_METADATA,
	features: {
		analytics: true,
		swaps: false, // hides the "Swap" entry
		onramp: false, // optional: hides "Fund wallet"
		send: false, // optional: hides "Send"
	},
	themeMode: "light",
	themeVariables: {
		"--apkt-accent": "#000000",
		"--apkt-color-mix": "#FFFFFF",
		"--apkt-color-mix-strength": 40,
	},
});

export default function Web3ModalProvider({ children, initialState }: { children: ReactNode; initialState?: State }) {
	return (
		<WagmiProvider config={WAGMI_CONFIG as Config} initialState={initialState}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</WagmiProvider>
	);
}

"use client";

import React, { ReactNode } from "react";
import { WAGMI_CONFIG, CONFIG } from "../app.config";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { State, WagmiProvider } from "wagmi";

const queryClient = new QueryClient();
if (!CONFIG.wagmiId) throw new Error("Project ID is not defined");

createWeb3Modal({
	wagmiConfig: WAGMI_CONFIG,
	projectId: CONFIG.wagmiId,
	enableAnalytics: false,
	themeMode: "light",
	themeVariables: {
		"--w3m-color-mix": "#ffffff",
		"--w3m-color-mix-strength": 40,
	},
});

export default function Web3ModalProvider({ children, initialState }: { children: ReactNode; initialState?: State }) {
	return (
		<WagmiProvider config={WAGMI_CONFIG} initialState={initialState}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</WagmiProvider>
	);
}

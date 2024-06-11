"use client";

import React, { ReactNode } from "react";
import { WAGMI_CONFIG, WAGMI_PROJECT_ID } from "../app.config";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { State, WagmiProvider } from "wagmi";

const queryClient = new QueryClient();
if (!WAGMI_PROJECT_ID) throw new Error("Project ID is not defined");

createWeb3Modal({
	wagmiConfig: WAGMI_CONFIG,
	projectId: WAGMI_PROJECT_ID,
	enableAnalytics: true,
});

export default function Web3ModalProvider({ children, initialState }: { children: ReactNode; initialState?: State }) {
	return (
		<WagmiProvider config={WAGMI_CONFIG} initialState={initialState}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</WagmiProvider>
	);
}

"use client";

import React from "react";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import { WagmiConfig } from "wagmi";
import { WAGMI_PROJECT_ID as projectId, WAGMI_CHAINS as chains, WAGMI_METADATA as metadata } from "../app.config";

// https://docs.walletconnect.com/web3modal/nextjs/wagmi/about/implementation#wagmi-config
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });
createWeb3Modal({ wagmiConfig, projectId, chains });

export function Web3Modal({ children }: { children: React.ReactElement }) {
	return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}

"use client";

import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";

import { WagmiConfig } from "wagmi";
import { mainnet } from "viem/chains";
import React from "react";

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = "26fb3341cffa779adebdb59dc32b24e5";

const chains = [mainnet];

// 2. Create wagmiConfig
const metadata = {
  name: "Frankencoin",
  description: "Frankencoin Frontend",
  url: "https://frankencoin.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// https://docs.walletconnect.com/web3modal/nextjs/wagmi/about/implementation#wagmi-config
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains });

export function Web3Modal({ children }: { children: React.ReactElement }) {
  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}

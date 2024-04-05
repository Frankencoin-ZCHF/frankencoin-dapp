"use client";

import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";

import { WagmiConfig } from "wagmi";
import { mainnet } from "viem/chains";
import React from "react";

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = "75da506ed9c39c840e6c5a5180014870";

const chains = [mainnet];

// 2. Create wagmiConfig
const metadata = {
  name: "Web3Modal",
  description: "Web3Modal Example",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains });

export function Web3Modal({ children }: { children: React.ReactElement }) {
  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}

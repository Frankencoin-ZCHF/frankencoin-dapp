import "../styles/globals.css";
import type { AppProps } from "next/app";
import { NextSeo } from "next-seo";
import Layout from "../components/Layout";
import { createPublicClient, http } from 'viem'
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { mainnet, hardhat } from 'wagmi/chains'
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { Web3Modal } from "@web3modal/react";

const chains = [hardhat, mainnet]
const projectId = '75da506ed9c39c840e6c5a5180014870'
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ chains, projectId }),
  publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig} >
      <NextSeo
        title="FrankenCoin"
        description="The Frankencoin is a collateralized, oracle-free stablecoin that tracks the value of the Swiss franc."
        openGraph={{
          type: "website",
          locale: "en_US",
          url: "https://frankencoin.com/",
          // images: [
          //   {
          //     url: "https://frankencoin.com//splash.png",
          //     width: 1670,
          //     height: 1158,
          //     alt: "landing page preview",
          //   },
          // ],
        }}
        twitter={{
          handle: "@frankencoinzchf",
          site: "@frankencoinzchf",
          cardType: "summary_large_image",
        }}
        themeColor="#d35384"
        additionalLinkTags={[
          {
            rel: "icon",
            href: "/favicon.ico",
            type: "image/png",
          },
        ]}
      />

      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </WagmiConfig>
  );
}

import "../styles/globals.css";
import type { AppProps } from "next/app";
import {
  DAppProvider,
  Config,
  MetamaskConnector,
  CoinbaseWalletConnector,
  Chain,
  Mainnet,
  Hardhat,
} from "@usedapp/core";
import { NextSeo } from "next-seo";
import { WalletConnectConnector } from "@usedapp/wallet-connect-connector";
import Layout from "../components/Layout";

const config: Config = {
  readOnlyChainId: Mainnet.chainId,
  readOnlyUrls: {
    [Hardhat.chainId]: Hardhat.rpcUrl!,
    [Mainnet.chainId]: "https://zksync2-testnet.zksync.dev",
  },
  networks: [Hardhat, Mainnet],
  connectors: {
    metamask: new MetamaskConnector(),
    coinbase: new CoinbaseWalletConnector(),
    walletConnect: new WalletConnectConnector({
      infuraId: "2920e698d02f40ca8724daa8a19a91e7",
    }),
  },
  multicallAddresses: "0x3b545BF3A4f9C3e3dAc4B9DD05b6702e2CfF79e7",
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DAppProvider config={config}>
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
            href: "/logo.svg",
            type: "image/png",
          },
        ]}
      />

      <Layout>
        <Component {...pageProps} />
      </Layout>
    </DAppProvider>
  );
}

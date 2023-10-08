import "../styles/globals.css";
import type { AppProps } from "next/app";
import { NextSeo } from "next-seo";
import Layout from "@components/Layout";
import { EthereumClient, w3mConnectors } from "@web3modal/ethereum";
import { mainnet, sepolia } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { Web3Modal } from "@web3modal/react";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const chains = [mainnet, sepolia];
const projectId = "75da506ed9c39c840e6c5a5180014870";
const { publicClient } = configureChains(chains, [
  alchemyProvider({ apiKey: "xkAazrbIALbAxhLrOCDqD9yasyMRFXtg" }),
]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ chains, projectId }),
  publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

const apolloClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/frankencoin-zchf/frankencoin-subgraph",
  cache: new InMemoryCache(),
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <ApolloProvider client={apolloClient}>
        <NextSeo
          title="Frankencoin"
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

        <ToastContainer
          position="bottom-right"
          hideProgressBar={false}
          rtl={false}
          theme="dark"
        />
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Web3Modal
          projectId={projectId}
          ethereumClient={ethereumClient}
          themeMode="dark"
        />
      </ApolloProvider>
    </WagmiConfig>
  );
}

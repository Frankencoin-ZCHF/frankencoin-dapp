"use client";
import "../styles/globals.css";
import "../styles/datepicker.css";
import type { AppProps } from "next/app";
import { NextSeo } from "next-seo";
import Layout from "@components/Layout";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Web3Modal } from "@components/Web3Modal";
import { useTokenPrice, useTokenPrices } from "@hooks";

const apolloClient = new ApolloClient({
  uri: "https://ponder2.frankencoin.com/",
  cache: new InMemoryCache(),
});

export default function App({ Component, pageProps }: AppProps) {
  useTokenPrices();
  useTokenPrice("0xB58E61C3098d85632Df34EecfB899A1Ed80921cB");
  return (
    <Web3Modal>
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
      </ApolloProvider>
    </Web3Modal>
  );
}

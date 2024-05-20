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
import NextSeoProvider from "@components/NextSeoProvider";

const apolloClient = new ApolloClient({
	uri: "https://ponder3.frankencoin.com/",
	cache: new InMemoryCache(),
});

export default function App({ Component, pageProps }: AppProps) {
	useTokenPrices();
	useTokenPrice("0xB58E61C3098d85632Df34EecfB899A1Ed80921cB");
	return (
		<Web3Modal>
			<ApolloProvider client={apolloClient}>
				<NextSeoProvider />
				<ToastContainer position="bottom-right" hideProgressBar={false} rtl={false} theme="dark" />

				<Layout>
					<Component {...pageProps} />
				</Layout>
			</ApolloProvider>
		</Web3Modal>
	);
}

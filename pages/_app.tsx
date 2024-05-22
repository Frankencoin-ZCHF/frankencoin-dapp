"use client";
import "../styles/globals.css";
import "../styles/datepicker.css";
import "react-toastify/dist/ReactToastify.css";
import type { AppProps } from "next/app";

import Layout from "@components/Layout";
import NextSeoProvider from "@components/NextSeoProvider";
import { ApolloProvider } from "@apollo/client";
import { Provider as ReduxProvider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { Web3Modal } from "@components/Web3Modal";
import { store } from "../redux/redux.store";
import { client } from "../app.config";
import { useTokenPrice, useTokenPrices } from "@hooks";
import BlockUpdater from "@components/BlockUpdater";

export default function App({ Component, pageProps }: AppProps) {
	// useTokenPrices();
	// useTokenPrice("0xB58E61C3098d85632Df34EecfB899A1Ed80921cB");
	return (
		<ReduxProvider store={store}>
			<Web3Modal>
				<ApolloProvider client={client}>
					<BlockUpdater />
					<NextSeoProvider />
					<ToastContainer position="bottom-right" hideProgressBar={false} rtl={false} theme="dark" />

					<Layout>
						<Component {...pageProps} />
					</Layout>
				</ApolloProvider>
			</Web3Modal>
		</ReduxProvider>
	);
}

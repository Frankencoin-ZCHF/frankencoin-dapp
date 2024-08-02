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
import Web3ModalProvider from "@components/Web3Modal";
import { store } from "../redux/redux.store";
import { PONDER_CLIENT } from "../app.config";
import BlockUpdater from "@components/BlockUpdater";
import { useIsMainnet } from "@hooks";

export default function App({ Component, pageProps }: AppProps) {
	const isMainnet = useIsMainnet();
	return (
		<ReduxProvider store={store}>
			<Web3ModalProvider>
				<ApolloProvider client={PONDER_CLIENT}>
					<BlockUpdater>
						<NextSeoProvider />
						<ToastContainer position="bottom-right" hideProgressBar={false} rtl={false} theme="dark" />

						{isMainnet ? (
							<></>
						) : (
							<div className="bg-red-400 text-gray-900 absolute bottom-2 text-center font-bold inset-x-2 mx-2 px-4 rounded-xl">
							This is a test deployment and not the real Frankencoin.
							</div>
						)}

						<Layout>
							<Component {...pageProps} />
						</Layout>
					</BlockUpdater>
				</ApolloProvider>
			</Web3ModalProvider>
		</ReduxProvider>
	);
}

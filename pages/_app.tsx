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
import USGovSanctionList from "@components/USGovSanctionList";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ReduxProvider store={store}>
			<Web3ModalProvider>
				<ApolloProvider client={PONDER_CLIENT}>
					<BlockUpdater>
						<NextSeoProvider />
						<ToastContainer position="bottom-right" hideProgressBar={false} rtl={false} theme="dark" />
						<USGovSanctionList />

						<Layout>
							<Component {...pageProps} />
						</Layout>
					</BlockUpdater>
				</ApolloProvider>
			</Web3ModalProvider>
		</ReduxProvider>
	);
}

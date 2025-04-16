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
import { FrontendCodeProvider } from "@components/FrontendCodeProvider";
import { appWithTranslation } from "next-i18next";
import { useLanguageSelector } from "../hooks/useLanguageSelector";

function App({ Component, pageProps }: AppProps) {
	useLanguageSelector();

	return (
		<ReduxProvider store={store}>
			<Web3ModalProvider>
				<ApolloProvider client={PONDER_CLIENT}>
					<BlockUpdater>
						<FrontendCodeProvider>
							<NextSeoProvider />
							<ToastContainer
								className="border-card-content-primary border-2 bg-card-body-primary rounded-xl"
								toastClassName={(c) => "bg-card-body-primary text-text-primary rounded-xl"}
								position="bottom-right"
								hideProgressBar={false}
								rtl={false}
								closeButton={false}
							/>
							<USGovSanctionList />
							<Layout>
								<Component {...pageProps} />
							</Layout>
						</FrontendCodeProvider>
					</BlockUpdater>
				</ApolloProvider>
			</Web3ModalProvider>
		</ReduxProvider>
	);
}

export default appWithTranslation(App);

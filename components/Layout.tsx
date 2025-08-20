import Head from "next/head";
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useIsMainnet } from "../hooks/useWalletConnectStats";

type LayoutProps = {
	children: NonNullable<ReactNode>;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
	const isMainnet = useIsMainnet();

	return (
		<div className="flex flex-col min-h-screen">
			<Head>
				<title>dEURO - Home</title>
			</Head>

			<Navbar />

			<main className="flex-1 pt-24 pb-16">
				<div className="mx-auto max-w-6xl space-y-8 px-4 md:px-8 2xl:max-w-7xl">{children}</div>
			</main>
			
			<Footer />
		</div>
	);
};

export default Layout;

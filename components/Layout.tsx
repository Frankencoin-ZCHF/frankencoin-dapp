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
		<div>
			<Head>
				<title>Frankencoin - Home</title>
			</Head>

			<Navbar />

			<div className="h-main pt-24">
				<main className="block mb-16 mx-auto max-w-6xl space-y-8 px-4 md:px-8 2xl:max-w-7xl min-h-content">{children}</main>
				<Footer />
			</div>
		</div>
	);
};

export default Layout;

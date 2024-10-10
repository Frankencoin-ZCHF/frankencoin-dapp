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
		<>
			<Head>
				<title>Frankencoin - Home</title>
			</Head>
			<Navbar />
			<div className="h-main pt-24">
				<main className="block mx-auto max-w-6xl space-y-8 px-4 md:px-8 2xl:max-w-7xl min-h-content">{children}</main>

				<div className="pb-1">
					<Footer />
				</div>

				{isMainnet ? (
					<></>
				) : (
					<div className="bg-card-body-primary shadow-lg text-text-warning text-center font-bold inset-x-2 mx-2 px-4 pb-5 rounded-xl">
						This is a test deployment and not the real Frankencoin.
					</div>
				)}
			</div>
		</>
	);
};

export default Layout;

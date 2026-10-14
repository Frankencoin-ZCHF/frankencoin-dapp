import Head from "next/head";
import { ReactNode } from "react";
import { useRouter } from "next/router";
import Navbar from "./Navbar";
import Footer from "./Footer";

type LayoutProps = {
	children: NonNullable<ReactNode>;
};

// pages that take over the whole viewport (no navbar, no footer, no content width)
const FULLSCREEN_ROUTES = ["/godeye"];

const Layout: React.FC<LayoutProps> = ({ children }) => {
	const { pathname } = useRouter();
	if (FULLSCREEN_ROUTES.includes(pathname)) return <>{children}</>;

	return (
		<div>
			<Head>
				<title>Frankencoin - Home</title>
			</Head>

			<Navbar />

			<div className="h-main pt-20">
				<main className="block mb-24 mx-auto max-w-6xl space-y-8 px-4 md:px-8 2xl:max-w-7xl min-h-content">{children}</main>
				<Footer />
			</div>
		</div>
	);
};

export default Layout;

import Head from "next/head";
import { ReactNode } from "react";
import Navbar from "./Navbar";
// import Footer from "./Footer";

type LayoutProps = {
  children: NonNullable<ReactNode>;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Head>
        <title>FrankenCoin - Home</title>
      </Head>
      <main className="block">
        <Navbar />
        {children}
        {/* <Footer /> */}
      </main>
    </>
  );
};

export default Layout;

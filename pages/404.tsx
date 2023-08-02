import Head from "next/head";
import Link from "next/link";
// import Logo from "../components/Logo";
import { SOCIAL } from "../utils";

export default function Custom404() {
  return (
    <main className="container-xl mx-auto">
      <Head>
        <title>FrankenCoin - 404</title>
      </Head>

      <div
        className="flex flex-col items-center justify-center w-full"
        style={{ height: "60vh" }}
      >
        {/* <Logo /> */}
        <h1 className="text-4xl font-bold mt-10">
          You seem to be in the wrong place
        </h1>
        <p className="text-2xl font-bold mt-4">
          <Link
            href={SOCIAL.Telegram}
            className="mr-4 hover:underline md:mr-6 text-indigo-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ping us on Telegram if you think this is a bug
          </Link>
        </p>
      </div>
    </main>
  );
}

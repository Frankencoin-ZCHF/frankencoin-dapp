import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head></Head>
      <body className="font-sans px-0 md:px-8 max-w-screen-2xl container-xl mx-auto bg-gray-200 bg-gray-900 text-slate-400">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

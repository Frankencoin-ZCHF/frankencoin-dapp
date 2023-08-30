import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head></Head>
      <body className="font-sans px-8 max-w-screen-2xl container-xl mx-auto bg-gray-200 dark:bg-slate-900 dark:text-slate-400">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

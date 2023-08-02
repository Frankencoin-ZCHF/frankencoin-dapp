import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
      </Head>

      <body className="font-sans px-8 max-w-screen-2xl container-xl mx-auto bg-zinc-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

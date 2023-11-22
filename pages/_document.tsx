import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* <!-- Global site tag (gtag.js) - Google Analytics --> */}
        {/* <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XJVPND1PEZ"
          strategy="afterInteractive"
        ></Script>
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XJVPND1PEZ');
        `}
        </Script> */}
      </Head>

      <body className="text-white font-sans px-8 max-w-screen-2xl container-xl mx-auto bg-zinc-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

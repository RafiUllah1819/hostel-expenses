import type { AppProps } from "next/app";
import Head from "next/head";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Viewport — required for Tailwind responsive classes to work on mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Default page title — individual pages override this with their own <Head> */}
        <title>ExpenseMate</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

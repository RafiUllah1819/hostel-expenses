import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Character encoding */}
        <meta charSet="utf-8" />

        {/* App description — shown in search engines and link previews */}
        <meta
          name="description"
          content="ExpenseMate — shared expense tracker for hostel groups and flatmates."
        />

        {/* Favicon — replace public/favicon.ico with your own icon */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

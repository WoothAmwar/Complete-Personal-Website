import { Html, Head, Main, NextScript } from "next/document";

/**
 * Applies the saved theme before the first paint.
 *
 * This runs as a blocking inline script so the page never renders in the wrong
 * theme and then snaps. It reads the same localStorage key the ThemeProvider
 * writes ("pm-theme") and mirrors the same rule: an explicit "light"/"dark"
 * choice sets data-theme on <html>; "system" (the default) leaves the attribute
 * off, which hands the decision to the prefers-color-scheme block in
 * globals.css.
 */
const THEME_BOOTSTRAP = `
(function () {
  try {
    var stored = window.localStorage.getItem("pm-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {
    /* Private mode or storage disabled: fall through to the system theme. */
  }
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* The browser chrome color has to be a literal, so these are the only
            two hex values outside globals.css. They mirror --bg-canvas in each
            theme; change them together. */}
        <meta name="theme-color" content="#08080b" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#fbfbfc" media="(prefers-color-scheme: light)" />
        {/* Scroll reveals are server-rendered at opacity 0 and animated in on
            the client. Without this, a page whose JavaScript never arrives
            would render its content invisibly. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

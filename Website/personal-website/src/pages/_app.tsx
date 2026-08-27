import React, { useEffect, useState } from "react";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Bricolage_Grotesque, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { useCookies } from "react-cookie";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import NavigationBar from "@/components/NavigationBar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { QueueProvider } from "@/components/queue/QueueProvider";
import { LinkButton } from "@/components/ui/primitives";

import "@/app/globals.css";

/**
 * Type system.
 *  - Bricolage Grotesque carries headlines. It has real character at large
 *    sizes without reading as a stock geometric sans.
 *  - Plus Jakarta Sans does all the reading work: UI labels, body, video
 *    titles. Chosen for legibility at 13-15px, which is most of this product.
 *  - JetBrains Mono is reserved for counts, dates and ids, so numbers line up.
 * Each is exposed as a CSS variable and consumed through tailwind.config.ts.
 */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 60_000 },
  },
});

const PUBLIC_ROUTES = ["/", "/about"];

/** Full-bleed routes manage their own background, padding and footer. */
const BARE_ROUTES = ["/custom-youtube/[videoId]"];

/**
 * Routes that fill the viewport instead of growing with their content. These
 * pages scroll inside their own panes, so the shell must not scroll too.
 */
const FULL_HEIGHT_ROUTES = ["/custom-youtube"];

// Add an entry here (and a matching class in globals.css) to give any route its
// own full-screen background.
const PAGE_BACKGROUNDS: Record<string, string> = {
  "/": "bg-landing",
};

function SignedOutNotice() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Sign in to open this page
      </h1>
      <p className="max-w-prose text-ink-muted">
        Your subscriptions, tags and queue are tied to your Google account. Sign
        in from the homepage and this page will be waiting.
      </p>
      <LinkButton href="/" variant="primary" size="lg">
        Go to the homepage
      </LinkButton>
    </div>
  );
}

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  // The profile cookie is only readable in the browser, so the server cannot
  // know who you are. Until the first client render lands, a protected route
  // renders nothing rather than flashing "sign in" at someone already signed in.
  const [resolved, setResolved] = useState(false);
  const [cookies] = useCookies(["profile"]);

  useEffect(() => {
    setSignedIn(cookies.profile !== null && cookies.profile !== undefined);
    setResolved(true);
  }, [cookies]);

  const isPublic = PUBLIC_ROUTES.includes(router.pathname);
  const canView = isPublic || signedIn;
  const isBare = BARE_ROUTES.includes(router.pathname);
  const isFullHeight = FULL_HEIGHT_ROUTES.includes(router.pathname) && canView;
  const backgroundClass = PAGE_BACKGROUNDS[router.pathname] ?? "bg-app";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GoogleOAuthProvider clientId="224517591075-783fat3nia6np4el8jhuvi75it5bhgro.apps.googleusercontent.com">
          <QueueProvider>
            <Head>
              <title>Pure Media</title>
              <meta name="description" content="Your YouTube subscriptions, without the feed." />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Analytics />
            <SpeedInsights />

            <div
              className={`${display.variable} ${sans.variable} ${mono.variable} flex flex-col font-sans ${backgroundClass} ${
                isFullHeight ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"
              }`}
            >
              <NavigationBar />

              {canView ? (
                isBare ? (
                  <main className="flex-1">
                    <Component {...pageProps} />
                  </main>
                ) : (
                  <main
                    className={`mx-auto w-full max-w-content flex-1 ${
                      isFullHeight ? "flex min-h-0 flex-col" : "px-3"
                    }`}
                  >
                    <Component {...pageProps} />
                  </main>
                )
              ) : resolved ? (
                <main className="flex-1">
                  <SignedOutNotice />
                </main>
              ) : (
                <main className="flex-1" aria-busy="true" />
              )}

              <footer
                className={`border-t border-line-subtle ${
                  isBare || isFullHeight ? "hidden" : ""
                }`}
              >
                <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-6 text-[13px] text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p>Pure Media. Built by Anwar Kader. © Copyright Anwar Kader 2026 (Not real copyright)</p>
                  <div className="flex items-center gap-4">
                    <Link href="/about" className="transition-colors hover:text-ink">
                      About
                    </Link>
                    <a
                      href="https://github.com/WoothAmwar/Complete-Personal-Website"
                      className="transition-colors hover:text-ink"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source
                    </a>
                  </div>
                </div>
              </footer>
            </div>
          </QueueProvider>
        </GoogleOAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

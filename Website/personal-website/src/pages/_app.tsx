import React from 'react';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Head from 'next/head';
import NavigationBar from '@/components/NavigationBar';

import { GoogleOAuthProvider } from '@react-oauth/google';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { useState, useEffect } from "react";
import { CookiesProvider, useCookies } from "react-cookie";
import Link from "next/link";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import "@/app/globals.css"

const queryClient = new QueryClient();
const PUBLIC_ROUTES = ['/'];

// Add an entry here (and a matching class in globals.css) to give any route its own full-screen background.
const PAGE_BACKGROUNDS: Record<string, string> = {
  '/': 'bg-landing',
};

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [cookies] = useCookies(['profile']);

    useEffect(() => {
        const userSignedIn = cookies.profile !== null && cookies.profile !== undefined;
        setSignedIn(userSignedIn);
    },
    [cookies]);

  const canView = signedIn || PUBLIC_ROUTES.includes(router.pathname);
  const backgroundClass = PAGE_BACKGROUNDS[router.pathname] ?? 'main-bg';

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId="224517591075-783fat3nia6np4el8jhuvi75it5bhgro.apps.googleusercontent.com">
        <Head>
          <title>Pure Media</title>
          <meta name="description" content="YouTube Viewing but better" />
        </Head>
        <Analytics />
        <SpeedInsights />
        <NavigationBar {...pageProps}/>
        {canView ? (
          <div className={`min-h-screen p-4 pb-10 ${backgroundClass}`}>
            <main>
              <Component {...pageProps} />
            </main>
          </div>
          ) : (
            <div className="text-center text-[4rem] mt-8">
              <p> Please Sign In to View This Page</p>
              <Link key={1} href="/">
                <p className="font-['Garamond'] text-xl text-sky-500">Return to Homepage</p>
              </Link>
            </div>
          )}
        <footer className="grid grid-rows-1 text-center">
          <p>Copyright &copy; 2024 Anwar Kader (Not real Copyright)</p>
        </footer>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;

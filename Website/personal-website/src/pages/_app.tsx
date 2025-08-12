import React from 'react';
import { AppProps } from 'next/app';
import NavigationBar from '@/components/NavigationBar';

import { GoogleOAuthProvider } from '@react-oauth/google';

import { useState, useEffect } from "react";
import { CookiesProvider, useCookies } from "react-cookie";
import Link from "next/link";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  const [signedIn, setSignedIn] = useState(false);
  const [cookies] = useCookies(['profile']);

    useEffect(() => {
        const userSignedIn = cookies.profile !== null && cookies.profile !== undefined;
        setSignedIn(userSignedIn);
    }, 
    [cookies]);
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId="224517591075-783fat3nia6np4el8jhuvi75it5bhgro.apps.googleusercontent.com">
        {signedIn ? (
          <div>  
            <NavigationBar {...pageProps}/>
            <main>
              <Component {...pageProps} />
            </main>
            <footer className="grid grid-rows-1 text-center">
              <p>Copyright &copy; 2024 Anwar Kader (Not real Copyright)</p>
            </footer>
          </div>
          ) : (
            <div className="text-center web-header mt-8">
              <p> Please Sign In to View This Page</p>
              <Link key={1} href="/">
                <p className="font-['Garamond'] text-xl text-sky-500">Return to Homepage</p>
              </Link>
            </div>
          )}
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;

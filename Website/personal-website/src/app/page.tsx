'use client'
import Link from "next/link";
import "./globals.css";
import NavigationBar from '@/components/NavigationBar';

import { useState, useEffect } from 'react';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { CookiesProvider, useCookies } from 'react-cookie'
import { googleLogout, useGoogleLogin } from '@react-oauth/google';

import LoginButton from "@/components/buttons/LoginButton";

export default function Home() {
  // console.log(cookies.user)
  // const userInfo = CurrentUserCookieInfo();
  return (
    <GoogleOAuthProvider clientId="224517591075-783fat3nia6np4el8jhuvi75it5bhgro.apps.googleusercontent.com">
      <CookiesProvider> 
        <div className="ml-40 mt-8 font-mono justify-items-stretch">
          {/* Top of the screen */}
          <div className="grid grid-rows-1 grid-flow-col ">
            <div className="mr-40 grid grid-cols-1 justify-self-end">
              <LoginButton />
            </div>
          </div>

          <div className="grid grid-rows-2 grid-flow-col mr-20">
            <h1 className="web-header grid grid-cols-2">Welcome to Pure Media Website</h1>
            <div className="mt-5">
              <p className="text-xl"> YouTube Without Ads and Extra Info </p>
              <p>
                If you want to just watch videos, never worry about checking YouTube for the latest videos, and take control of 
                when and what you watch, you have come to the right place 
              </p>
            </div>
          </div>
        </div>
      </CookiesProvider>
    </GoogleOAuthProvider>
  )
}

'use client'
import Link from "next/link";
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
        <div className="p-12 font-mono justify-items-stretch">
          <div className="grid grid-rows-2 grid-flow-col mr-20">
            <div className="text-[4rem]">Welcome to Pure Media Website</div>
            <div className="mt-5">
              <p className="text-xl"> YouTube Without All the Fluff </p>
              <p>
                If you want to just watch videos, never worry about checking YouTube for the latest videos, and take control of 
                when and what you watch, you have come to the right place.
              </p>
            </div>
          </div>
          <br />

          <div className="flex">
            <div className="justify-self-start">
              <LoginButton />
            </div>
          </div>

          <h2 className="text-3xl text-center">Features</h2>
          <br />
          <div className="px-20 grid grid-cols-3 gap-4">
            <div>
              <ul>
                <li>Sync with your Youtube Subscriptions</li>
                <li>Save to Watch Later</li>
                <li>Favorite Videos</li>
              </ul>
            </div>
            <div>
              <ul>
                <li>Sort Channels by Tags</li>
                <li>View Videos by Release Date</li>
                <li>Stop updating from subscribed channels</li>
              </ul>
            </div>
            <div>
              <ul>
                <li>Set how frequently Channels should be Updated</li>
                <li>Create color-coded tags for channels</li>
                <li>Keep ad-free experience, and all other features, if YouTube Premium member</li>
              </ul>
            </div>
          </div>
        </div>
      </CookiesProvider>
    </GoogleOAuthProvider>
  )
}

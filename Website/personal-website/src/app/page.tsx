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
            <h1 className="web-header grid grid-cols-2">Welcome to Random Projects</h1>
            <div className="mt-5">
              <p className="text-xl"> About this Project </p>
              <p>
                I am trying to make a YouTube without ads and extra info (comments,
                recommendations, etc.)
              </p>
              <p>
                I also want a page that I can add different things that I want, and I
                can upload files to set a graphic for it{" "}
              </p>
              <p>
                For example, I could add something where you add a link and part of
                the link that you edit to keep track of chapter in books,
                or have a to-do list, etc.
              </p>
            </div>
          </div>
        </div>
      </CookiesProvider>
    </GoogleOAuthProvider>
  )
}

import React, { useEffect, useState } from "react";
import "../app/globals.css";

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { CookiesProvider, useCookies } from 'react-cookie'

import { CurrentUserId } from "@/helperFunctions/cookieManagement";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function About() {

  const thing = CurrentUserId();
  // Alternate implementation using Cron in Python being used instead of this
  // useEffect(() => {
  //   setInterval(() => {
  //     // http://localhost:5000
  //     // https://anwarkader.com
  //     fetch("https://anwarkader.com/api/home", {method: 'GET', credentials: 'include'})
  //     .then(response => response.json())
  //     .then(data => {
  //         setMessage(data.yt_data[0] + ":"+data.yt_data[1] + ":"+data.yt_data[2]);
  //         console.log("UPDATED");
  //     })
  //   }, 1000)
  // }, [])


  return (
    <CookiesProvider> 
    <div>
      <div>
        <h1> About this Project </h1>
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

      <div>
        Alter: {thing}
      </div>
    </div>
    </CookiesProvider>
  );
}

import React, { useEffect, useState } from "react";
import "../app/globals.css";

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function DropDown() {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          Options
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-25 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="./custom-youtube?order=byChannel"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block px-4 py-2 text-sm'
                  )}
                >
                  YT By Channel
                </a>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <a
                  href="./custom-youtube?order=byTime"
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block px-4 py-2 text-sm'
                  )}
                >
                  YT By Time
                </a>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
export default function About() {

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
      <div className="ml-40">
        {DropDown()}
      </div>
    </div>
  );
}

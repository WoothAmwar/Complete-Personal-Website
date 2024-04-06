'use client'

import { useState, useEffect, ReactNode } from 'react';
import Link from "next/link";
import "../../app/globals.css"

import OrderByChannel from "../../components/ChannelOrder";
import OrderByTime from "../../components/UploadOrder";

import { useSearchParams } from 'next/navigation';

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

function UseTime(props: {order:string}) {
  if (props.order == "byTime") {
    return (
      <div className="grid grid-cols-3 font-mono">
        {<OrderByTime />}
      </div>
    );
  }
  return (
    <div></div>
  );
}

function UseChannel(props: {order:string}) {
  if (props.order == "byOrder") {
    return (
      <div className="grid grid-cols-1 font-mono">
        {<OrderByChannel />}
      </div>
    );
  }
  return (
    <div></div>
  );
}


/**
 * Determines what way to sort videos and which component to render
 * @returns String - byTime, byChannel
 */
function QueryOrder() {
  const searchParams = useSearchParams();
  
  if (searchParams?.has("order")) {
    const search = searchParams.get('order');
    // URL -> `/dashboard?search=my-project`
    // `search` -> 'my-project'
    if (search == null) {
      return "byChannel";
    }
    return search;
  } else {
    return "byChannel";
  }
}

// function GetHomepageLayout(props: {order:string}) {
//   if (props.order === "byChannel") {
//     return useChannel();
//   }
//   else if (props.order === "byTime") {
//     return useTime();
//   }
//   else {
//     return props.order;
//   }
// }

function GetHomepageLayout(props: {order:string}) {
  // Unconditionally call useChannel and useTime at the top level of the component
  return (
    <div>
      <UseChannel order={props.order} />
      <UseTime order={props.order} />
    </div>
  );
}

// TODO: Create a function that accepts orderMethod and return the function depending on the value
//   then use that insetad of the multiple if statements and return values
export default function HomePage() {
  const [orderMethod, setOrderMethod] = useState("byChannel");
  var getQueryOrder = QueryOrder();

  useEffect(() => {
    setOrderMethod(getQueryOrder);
  }, [getQueryOrder])
  

  return (
    <main className="flex flex-col items-center">
      <div className="grid items-center font-mono">
        <h2 className="text-center font-semibold text-lg py-4">
          Get Started with Youtube 
        </h2>
      </div>
      <GetHomepageLayout order={orderMethod} />
    </main>
  )
}
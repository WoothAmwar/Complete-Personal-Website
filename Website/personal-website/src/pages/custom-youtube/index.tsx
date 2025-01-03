'use client'

import { useState, useEffect, ReactNode, memo, useCallback } from 'react';
import Link from "next/link";
import "../../app/globals.css"

import OrderByChannel from "../../components/ChannelOrder";
import OrderByTime from "../../components/UploadOrder";
import {
  CurrentUserId
} from "@/helperFunctions/cookieManagement";

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

const UseTime = () => {
  const [currPageNumber, setPageNumber] = useState(1);
  const channelsPerPage = 5;
  // console.log("Show Channels:", props.showChannels)
  useEffect(() => {
    setPageNumber(1);
  }, [])

  const ButtonPage = () => {
    return (
      <div className="text-lg flex flex-row flex-nowrap items-stretch">
        <button className="flex-1 border-red-900 border-2 bg-neutral-800" onClick={() => {setPageNumber(Math.max(currPageNumber - 1, 1))}}>
          -
        </button>
        <div className="text-center flex-1">
          {currPageNumber}
        </div>
        <button className="flex-1 border-red-900 border-2 bg-neutral-800" onClick={() => {setPageNumber(currPageNumber + 1)}}>
          +
        </button>
      </div>
    );
  }

  return (
    <div>
      <ButtonPage />
      <div className="grid xl: grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-x-8 font-mono">
        {<OrderByTime pageTabNumber={currPageNumber} channelsPerPage={12}/>}
      </div>
      <ButtonPage />
    </div>
  );
}

function UseChannel(props: { showChannels: string[] }) {
  const [currPageNumber, setPageNumber] = useState(1);
  const channelsPerPage = 5;
  // console.log("Show Channels:", props.showChannels)
  useEffect(() => {
    setPageNumber(1);
  }, [props.showChannels])

  const ButtonPage = () => {
    return (
      <div className="text-lg flex flex-row flex-nowrap items-stretch">
        <button className="flex-1 border-red-900 border-2 bg-neutral-800" onClick={() => {setPageNumber(Math.max(currPageNumber - 1, 1))}}>
          {/* - ({Math.max(currPageNumber - 1, 1)}) */}
          -
        </button>
        <div className="text-center flex-1">
          {currPageNumber}
        </div>
        <button className="flex-1 border-red-900 border-2 bg-neutral-800" onClick={() => {setPageNumber(Math.min(currPageNumber + 1, Math.ceil((props.showChannels[0]!="None" ? props.showChannels.length : 10000) / channelsPerPage)))}}>
          {/* + ({Math.min(currPageNumber + 1, Math.ceil((props.showChannels[0]!="None" ? props.showChannels.length : 10000) / channelsPerPage))}) */}
          +
        </button>
      </div>
    );
  }

  return (
    <div>
      <ButtonPage />
      <div className="grid grid-cols-1 font-mono">
        {<OrderByChannel channelsToInclude={props.showChannels} pageTabNumber={currPageNumber} channelsPerPage={channelsPerPage} />}
      </div>
      <ButtonPage />
    </div>
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

// Define the props interface for TagSelectionDropDown
interface TagSelectionDropDownProps {
  onTagSelect: (tagName: string) => void;
}

const TagSelectionDropDown:React.FC<TagSelectionDropDownProps> = memo(function TagDropDown({onTagSelect}) {
  // console.log("Reload options");
  const currentUserGoogleId = CurrentUserId();
  const [totalTagOptions, setTotalTagOptions] = useState<string[]>(["None"]);
  // https://anwarkader.com/api/channels/tags/${currentUserGoogleId.toString()}
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/tags`, {
      method: 'GET',
      mode: 'cors',
      // credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-google-id': currentUserGoogleId.toString()
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log("DATA 11.1:", data);
        // setTotalTagOptions(JSON.parse(data["data"]));
        setTotalTagOptions(data);
      })
  }, []);

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          Filter by Tag
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
            {totalTagOptions.map((tagName, index) => (
              <Menu.Item key={index}>
                {({ active }) => (
                  <button
                    className={classNames(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block px-4 py-2 text-sm'
                    )}
                    onClick={() => { onTagSelect(tagName) }}
                  >
                    {tagName}
                  </button>
                )}
              </Menu.Item>
            ))}
            <Menu.Item key={12032019}>
              {({ active }) => (
                <button
                  className={classNames(
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block px-4 py-2 text-sm'
                  )}
                  onClick={() => { onTagSelect("None") }}
                >
                  None
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
});

// TODO: Create a function that accepts orderMethod and return the function depending on the value
//   then use that insetad of the multiple if statements and return values
export default function HomePage() {
  const currentUserGoogleId = CurrentUserId();

  const [orderMethod, setOrderMethod] = useState("byChannel");
  const [channelsFromFilter, setChannelsFromFilter] = useState<string[]>(["None"]);

  var getQueryOrder = QueryOrder();

  useEffect(() => {
    setOrderMethod(getQueryOrder);
  }, [getQueryOrder])

  const findChannelsOfTag = useCallback((tagName: string) => {
    console.log("Channels of Tag:", tagName)
    console.log("Updating Channels of Tag:", tagName);
    // https://anwarkader.com/api/channels/channelsOfTag/${currentUserGoogleId.toString()}/${tagName}
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/channelsOfTag/${tagName}`, { 
      method: 'GET', 
      mode: 'cors',
      // credentials: 'include'
      headers: {
        'Content-Type': 'application/json',
        'x-google-id': currentUserGoogleId.toString()
      }
    })
      .then(response => response.json())
      .then(data => {
        // console.log("Setting Channels Before:", data["data"]);
        // const raw_data = JSON.parse(data["data"]);
        // const raw_data = data;
        setChannelsFromFilter(data);
        // console.log("Setting Tags for", props.channelName.toString());
      })
      .catch(err => console.error("Error getting channels of tag", err));
  }, []);

  if (orderMethod == "byChannel") {
    return (
      <main className="flex flex-col justify-items-center mx-5">
        <div className="grid items-center font-mono">
          <h2 className="text-center font-semibold text-lg py-4 grid lg:grid-cols-4 md:grid-cols-2">
            <div className="justify-self-start ml-5"><TagSelectionDropDown onTagSelect={findChannelsOfTag}/></div>
            <p className="lg:col-start-2 lg:col-span-2 ">Get Started with Youtube 2.0</p>
            <div className="justify-self-end mr-5">{DropDown()}</div>
          </h2>
        </div>
        <UseChannel showChannels={channelsFromFilter} />
      </main>
    )
  }
  else if (orderMethod == "byTime") {
    return (
      <main className="flex flex-col justify-items-center mx-5">
        <div className="grid items-center font-mono">
          <h2 className="text-center font-semibold text-lg py-4 grid lg:grid-cols-4 md:grid-cols-2">
            <p className="lg:col-start-2 lg:col-span-2 ">Get Started with Youtube 2.0 #1</p>
            <div className="justify-self-end mr-5">{DropDown()}</div>
          </h2>
        </div>
        <UseTime />
      </main>
    )
  }
  return (
    <main className="flex flex-col items-center">
      <div className="grid items-center font-mono">
        <h2 className="text-center font-semibold text-lg py-4">
          Get Started with Youtube 2.0 Default
        </h2>
      </div>
      {orderMethod}
    </main>
  )
}
import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

import { CurrentUserId } from "@/helperFunctions/cookieManagement";

export function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export const getFavoriteVideos = async (currentUserGoogleID: string, getIdInfo: boolean) => {
    try {
        // http://localhost:5000/
        // https://anwarkader.com/
        const response = await fetch(`https://anwarkader.com/api/videos/favorites/${currentUserGoogleID}`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const raw_data = await response.json();
        var data = JSON.parse(raw_data["data"]);
        if (!getIdInfo) {
            return data;
        }
        var data_ids: string[] = [];
        for (var i = 0; i < data.length; i++) {
            data_ids.push(data[i]["videoId"])
        }
        return data_ids;
    } catch (err) {
        console.error("Error getting favorites", err);
        return null;
    }
}


const addFavorite = async (currentUserGoogleID: string, fullVideoDetails: any) => {
    try {
        // http://localhost:5000/
        // https://anwarkader.com/
        const response = await fetch(`https://anwarkader.com/api/videos/favorites/${currentUserGoogleID}`, {
            method: 'PUT',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: fullVideoDetails }),
        });

        // Check if response is ok (status in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("DTA", data);
        return data;
    } catch (err) {
        console.error("Error adding favorite", err);
        return null;
    }
};

const deleteFavorite = async (currentUserGoogleID: string, fullVideoDetails: any) => {
    try {
        // http://localhost:5000/
        // https://anwarkader.com/
        const response = await fetch(`https://anwarkader.com/api/videos/favorites/${currentUserGoogleID}`, {
            method: 'DELETE',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: fullVideoDetails }),
        });

        // Check if response is ok (status in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("DTA", data);
        return data;
    } catch (err) {
        console.error("Error adding favorite", err);
        return null;
    }
};


function VideoActionItems(videoID: string, fullVideoDetails: any) {
    const currentUserGoogleID = CurrentUserId();
    const [favoriteVideos, setFavoriteVideos] = useState<string[] | null>();
    const [favCounter, setFavCounter] = useState(0);

    useEffect(() => {
        const fetchFavoriteVideos = async () => {
            try {
                const receivedFavVideos = await getFavoriteVideos(currentUserGoogleID.toString(), true);
                // console.log("Setting Fav");
                setFavoriteVideos(receivedFavVideos);
            } catch (error) {
                console.error("Failed to fetch favorite videos", error);
            }
        };

        fetchFavoriteVideos();
    }, [favCounter]);

    const videoIsFavorite = (videoID: string) => {
        var foundFav = false;
        favoriteVideos?.forEach((element: string) => {
            if (element === videoID) {
                foundFav = true;
            }
        });
        return foundFav;
    }

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="mx-2 inline-flex w-full justify-center rounded-full text-lg font-semibold text-gray-300 shadow-sm hover:bg-slate-900">
                    <div className="options ml-1"></div>
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
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-slate-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="text-slate-100 text-center text-md">
                        <Menu.Item>
                            {({ active }) => (
                                <div>
                                    {videoIsFavorite(videoID) ? (
                                        <button onClick={() => { deleteFavorite(currentUserGoogleID.toString(), fullVideoDetails); setFavCounter(favCounter + 1); }} className={classNames(
                                            active ? 'bg-slate-700' : 'bg-slate-900',
                                            'block px-4 py-1 w-full'
                                        )}>
                                            <p>&#x2605; Unfavorite</p>
                                        </button>
                                    ) : (
                                        <button onClick={() => { addFavorite(currentUserGoogleID.toString(), fullVideoDetails); setFavCounter(favCounter + 1); }} className={classNames(
                                            active ? 'bg-slate-700' : 'bg-slate-900',
                                            'block px-4 py-1 w-full'
                                        )}>
                                            <p>&#x2606; Favorite</p>
                                        </button>
                                    )}
                                </div>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    )
}

export function VideoBox(props: { includeDate: boolean, width: number, fullVideoDetails: any }) {
    // var wd = 360  // 480
    var ht = props.width / 480 * 270  // 270
    var embedLink = "/custom-youtube/";
    return (
        <div key={guidGenerator()} className="rounded-xl mb-2">
            <Link href={embedLink.concat(props.fullVideoDetails["videoId"])}>
                <img src={props.fullVideoDetails["videoThumbnail"]} alt="Thumbnail" className="mb-1 rounded-xl" width={props.width} height={ht} />
            </Link>
            {/* <p className="font-semibold text-2x1">{props.fullVideoDetails["videoTitle"]}</p> */}
            <div className="grid grid-flow-col grid-cols-5 row-span-1">
                <div className="mr-5 col-span-4">
                    <Link href={embedLink.concat(props.fullVideoDetails["videoId"])}>
                        <p className="font-semibold text-md tracking-tighter line-clamp-2">{props.fullVideoDetails["videoTitle"]}</p>
                        {props.includeDate ? (
                            <p className="font-['Garamond'] text-slate-300 text-sm">Uploaded: {props.fullVideoDetails["uploadDate"].substr(0, 10)}</p>
                        ) : (<p></p>)}
                    </Link>
                </div>
                <div className="mr-2 col-start-5 flex justify-end">
                    {VideoActionItems(props.fullVideoDetails["videoId"], props.fullVideoDetails)}
                </div>
            </div>
            {/* </Link> */}

        </div>
    );
}
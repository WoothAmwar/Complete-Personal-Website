import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from 'next/image';
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos/favorites`, {
            method: 'GET',
            mode: 'cors',
            // credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleID.toString()
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const pure_data = await response.json();
        const raw_data = pure_data["data"];
        // console.log("RAW 1.2:", raw_data);
        // var data = JSON.parse(raw_data["data"]);
        // var data = raw_data;
        if (!getIdInfo) {
            return raw_data;
        }
        // console.log("RAW:", pure_data);
        var data_ids: string[] = [];
        for (var i = 0; i < raw_data.length; i++) {
            data_ids.push(raw_data[i]["videoId"])
        }
        // console.log("RAW 1.3:", data_ids);
        return data_ids;
    } catch (err) {
        console.error("Error getting favorites:",currentUserGoogleID, " | ", getIdInfo, " > ", err);
        return null;
    }
}


const addFavorite = async (currentUserGoogleID: string, fullVideoDetails: any) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos/favorites`, {
            method: 'PUT',
            mode: 'cors',
            // credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleID
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
        console.log("FULL:", fullVideoDetails);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos/favorites`, {
            method: 'DELETE',
            mode: 'cors',
            // credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleID
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


export const getWatchlaterVideos = async (currentUserGoogleID: string, getIdInfo: boolean) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos/watchlater`, {
            method: 'GET',
            mode: 'cors',
            // credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleID.toString()
            }
        });
        if (!response.ok) {
            // console.log("ERR 2.1:");
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const pure_data = await response.json();
        const raw_data = pure_data["data"];
        // console.log("RAW 1.1:", raw_data);
        // var data = JSON.parse(raw_data["data"]);
        // var data = raw_data;

        if (!getIdInfo) {
            return raw_data;
        }
        var data_ids: string[] = [];
        for (var i = 0; i < raw_data.length; i++) {
            data_ids.push(raw_data[i]["videoId"])
        }
        // console.log("RAW 1.2:", data_ids)
        return data_ids;
    } catch (err) {
        console.error("Error getting watch laters", err);
        return null;
    }
}


const addWatchlater = async (currentUserGoogleID: string, fullVideoDetails: any) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos/watchlater`, {
            method: 'PUT',
            mode: 'cors',
            // credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleID
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
        console.error("Error adding watch later", err);
        return null;
    }
};

const deleteWatchlater = async (currentUserGoogleID: string, fullVideoDetails: any) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos/watchlater`, {
            method: 'DELETE',
            mode: 'cors',
            // credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleID
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
        console.error("Error deleting watch later", err);
        return null;
    }
};

function VideoActionItems({ videoID, fullVideoDetails }: { videoID: string, fullVideoDetails: any }) {
    const currentUserGoogleID = CurrentUserId();
    const [favoriteVideos, setFavoriteVideos] = useState<string[] | null>();
    const [favCounter, setFavCounter] = useState(0);
    const [watchlaterVideos, setWatchlaterVideos] = useState<string[] | null>();
    const [watchlaterCounter, setWatchlaterCounter] = useState(0);

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
        const fetchWatchlaterVideos = async () => {
            try {
                const receivedWatchVideos = await getWatchlaterVideos(currentUserGoogleID.toString(), true);
                // console.log("Setting Fav");
                setWatchlaterVideos(receivedWatchVideos);
            } catch (error) {
                console.error("Failed to fetch watch later videos", error);
            }
        };

        fetchFavoriteVideos();
        fetchWatchlaterVideos();
    }, [favCounter, watchlaterCounter, currentUserGoogleID]);

    const videoIsFavorite = (videoID: string) => {
        var foundFav = false;
        favoriteVideos?.forEach((element: string) => {
            if (element === videoID) {
                foundFav = true;
            }
        });
        return foundFav;
    }

    const videoIsWatchlater = (videoID: string) => {
        var foundWatchlater = false;
        watchlaterVideos?.forEach((element: string) => {
            if (element === videoID) {
                foundWatchlater = true;
            }
        });
        return foundWatchlater;
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
                        <Menu.Item>
                            {({ active }) => (
                                <div>
                                    {videoIsWatchlater(videoID) ? (
                                        <button onClick={() => { deleteWatchlater(currentUserGoogleID.toString(), fullVideoDetails); setWatchlaterCounter(watchlaterCounter + 1); }} className={classNames(
                                            active ? 'bg-slate-700' : 'bg-slate-900',
                                            'block px-4 py-1 w-full'
                                        )}>
                                            <p>&#x2605; Remove Watch Later</p>
                                        </button>
                                    ) : (
                                        <button onClick={() => { addWatchlater(currentUserGoogleID.toString(), fullVideoDetails); setWatchlaterCounter(watchlaterCounter + 1); }} className={classNames(
                                            active ? 'bg-slate-700' : 'bg-slate-900',
                                            'block px-4 py-1 w-full'
                                        )}>
                                            <p>&#x2606; Add Watch Later</p>
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

export function VideoBox(props: { includeDate: boolean, fullVideoDetails: any }) {
    const embedLink = "/custom-youtube/";
    const videoId: string = props.fullVideoDetails["videoId"];
    const thumb: string = props.fullVideoDetails["videoThumbnail"];
    const title: string = props.fullVideoDetails["videoTitle"];
    return (
        <div className="rounded-xl mb-2">
            <Link href={embedLink.concat(videoId)}>
                <div className="relative mb-1 rounded-xl overflow-hidden aspect-video">
                    <Image
                        src={thumb}
                        alt="Thumbnail"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover"
                        priority={false}
                    />
                </div>
            </Link>
            <div className="grid grid-flow-col grid-cols-5 row-span-1">
                <div className="mr-5 col-span-4">
                    <Link href={embedLink.concat(videoId)}>
                        <p className="font-semibold text-md tracking-tighter line-clamp-2">{title}</p>
                        {props.includeDate ? (
                            <p className="font-['Garamond'] text-slate-300 text-sm">Uploaded: {props.fullVideoDetails["uploadDate"].substr(0, 10)}</p>
                        ) : (<p></p>)}
                    </Link>
                </div>
                <div className="mr-2 col-start-5 flex justify-end">
                    <VideoActionItems videoID={videoId} fullVideoDetails={props.fullVideoDetails} />
                </div>
            </div>
        </div>
    );
}

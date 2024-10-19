import { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import "../../app/globals.css";
import { CookiesProvider, useCookies } from "react-cookie";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import Image from 'next/image';

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import Button from "@mui/material/Button";
import TextField from '@mui/material/TextField';

import {
    CurrentUserCookieInfo, CurrentUserId
} from "@/helperFunctions/cookieManagement";
import ProfilePicture from "@/components/uiComponents/ProfilePicture";
import { getFavoriteVideos, VideoBox } from "@/components/VideoBox";


interface UserInfo {
    id: string;
    email: string;
    name: string;
    picture: string;
    verified: boolean;
}

const responsive = {
    desktop: {
        breakpoint: { max: 3000, min: 1024 },
        items: 3,
        slidesToSlide: 3 // optional, default to 1.
    },
    tablet: {
        breakpoint: { max: 1024, min: 464 },
        items: 2,
        slidesToSlide: 2 // optional, default to 1.
    },
    mobile: {
        breakpoint: { max: 464, min: 0 },
        items: 1,
        slidesToSlide: 1 // optional, default to 1.
    }
};

function FavoriteVideosDisplay(props: { currentUserGoogleID: string }) {
    const [videoInfo, setVideoInfo] = useState<any>();
    const getVideoInfo = async () => {
        try {
            const response = await getFavoriteVideos(props.currentUserGoogleID, false);
            setVideoInfo(response);
        } catch (err) {
            console.error("Error fetching video info", err);
        }
    }

    useEffect(() => {
        // console.log("DO");
        getVideoInfo();
    }, []);

    if (videoInfo == null) {
        return (
            <div>Loading...</div>
        )
    }

    // return (
    //     <Carousel
    //         swipeable={true}
    //         draggable={false}
    //         showDots={true}
    //         responsive={responsive}
    //         ssr={true} // means to render carousel on server-side.
    //         infinite={true}
    //         autoPlay={false}
    //         keyBoardControl={true}
    //         customTransition="all .5"
    //         transitionDuration={500}
    //         containerClass="carousel-container"
    //         removeArrowOnDeviceType={["mobile"]}
    //         dotListClass="custom-dot-list-style"
    //         itemClass="carousel-item-padding-40-px"
    //     >
    //         {videoInfo.map((element: any, index: number) => (
    //             <div key={index} className="mb-10 mx-2">
    //                 <VideoBox includeDate={false} fullVideoDetails={element} />
    //             </div>
    //         ))}
    //     </Carousel>
    // );

    return (
        <div className="flex overflow-x-scroll">
            <div className="flex flex-row">
                {videoInfo.map((element: any, index: number) => (
                    <div key={index} className="mx-2 flex-none w-96">
                        <VideoBox includeDate={false} fullVideoDetails={element} />
                        {/* <img src={"https://picsum.photos/550"} alt="random 1" width={550} height={550}/> */}
                    </div>
                ))}
            </div>
        </div>
    )

}

export default function Dashboard() {

    const [userProfile, setUserProfile] = useState<UserInfo | null>(null);
    const [profile_cookie, setCookie] = useCookies(["profile"]);
    const userInfo = CurrentUserCookieInfo();
    const currentUserGoogleID = CurrentUserId();

    const [newApiText, setNewApiText] = useState("");
    const [newChannelIdText, setNewChannelIdText] = useState("");

    useEffect(() => {
        if (userProfile === null) {
            setUserProfile(userInfo);
        }
    })

    // TODO - Add the option to get API and set that as the default text
    // Have the thing where the api key is shown as asterisks to hide it, and have a button to show the text
    // Make this a toggle button, so it switched back every time you click it

    const logOut = () => {
        googleLogout();
        setCookie("profile", null, { path: "/" });
        setUserProfile(null);
    };

    const handleChangeApiText = useCallback((event: any) => {
        setNewApiText(event.target.value);
    }, []);

    const handleChangeChannelIDText = useCallback((event: any) => {
        setNewChannelIdText(event.target.value);
    }, []);

    const updateYoutubeAPi = () => {
        console.log("New API:", newApiText);
        // http://localhost:5000/
        // https://anwarkader.com/
        fetch(`https://anwarkader.com/api/users/apiKey/${currentUserGoogleID.toString()}`,
            {
                method: 'PUT',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: newApiText }),
            })
            .then(response => response.json())
            .then(data => {
                console.log("Added API Key:", data);
            })
            .catch(err => console.error("Error adding api key of channel", err));
    }

    const updateYoutubeChannelID = () => {
        console.log("New ChannelID:", newChannelIdText);
        // http://localhost:5000/
        // https://anwarkader.com/
        fetch(`https://anwarkader.com/api/users/channelID/${currentUserGoogleID.toString()}`,
            {
                method: 'PUT',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: newChannelIdText }),
            })
            .then(response => response.json())
            .then(data => {
                console.log("Added ChannelID:", data);
            })
            .catch(err => console.error("Error adding channel id of channel", err));
    }

    return (
        <main className="grid lg:grid-cols-5 grid-cols-1 lg:grid-rows-1 grid-rows-2 divide-x-2 divide-slate-800 gap-x-2">
            <div className="relative lg:col-span-1 row-span-1 gap-4 flex flex-col py-4 lg:h-screen">
                <div className="items-center place-self-center">
                    <ProfilePicture imageLink={userProfile?.picture} imageSize={100} />
                </div>

                <div className="text-lg font-semibold text-center">
                    <div>
                        Welcome, {userProfile?.name}
                    </div>
                    <div>
                        {userProfile?.email}
                    </div>
                    <div className="my-2">
                        <TextField InputProps={{
                            style: { color: '#e7e5e4' }
                        }} size="small" id="outlined-basic" label="API Key" variant="outlined" value={newApiText} onChange={handleChangeApiText} color="primary" focused />
                        <Button onClick={updateYoutubeAPi}>Update API Key</Button>
                    </div>
                    <div className="my-2">
                        <TextField InputProps={{
                            style: { color: '#e7e5e4' }
                        }} size="small" id="outlined-basic" label="Channel ID" variant="outlined" value={newChannelIdText} onChange={handleChangeChannelIDText} color="primary" focused />
                        <Button onClick={updateYoutubeChannelID}>Update YT ID</Button>
                    </div>

                    <div>
                        Do not Know what API Key or Channel ID Means? Check out the <span>
                            <a key={9} href={"/about"} className="text-blue-400">About</a>
                        </span> Page for more information!
                    </div>
                </div>

                <div>
                    <button onClick={logOut} className="lg:absolute inset-x-0 bottom-0 w-full h-12 border-2 border-red-800 rounded-full">
                        <Link key={1} href="/">
                            <p className="font-['Garamond'] font-bold text-lg text-red-800 ">Log out</p>
                        </Link>
                    </button>
                </div>
            </div>
            <div className="col-span-4 pl-2">
                <div className="font-bold text-4xl mb-3">
                    Favorite Videos
                </div>
                <div className="col-span-full">
                    <FavoriteVideosDisplay currentUserGoogleID={currentUserGoogleID} />
                </div>

                <div className="w-48 h-12 border-2 border-slate-800 rounded-full text-center place-content-center">
                    <Link key={1} href="/custom-youtube/scheduler">
                        <p className="font-['Garamond'] font-bold text-lg">YT Scheduler</p>
                    </Link>
                </div>
            </div>
        </main>
    );
}

